import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Prisma } from "@prisma/client";

type SourceItem = {
  id: string;
  type: "source";
  prompt: null;
  url: string;
  sourceImage: { id: number; url: string; address?: string | null } | null;
};

type ResponseItem = {
  id: number;
  type: "response";
  prompt: string;
  url: string;
  step: number;
};

type ChainItem = SourceItem | ResponseItem;

type SqlBindable = string | number | bigint | boolean | Date | Buffer | null;

type Queryable = {
  $queryRaw<T = unknown>(query: Prisma.Sql): Promise<T>;
  $queryRaw<T = unknown>(
    query: TemplateStringsArray,
    ...values: SqlBindable[]
  ): Promise<T>;
};

// Build a linear response chain using only raw SQL (avoids reliance on generated client types)
async function buildResponseChain(
  db: Queryable,
  responseId: number,
): Promise<ChainItem[]> {
  const startRows = await db.$queryRaw<
    Array<{
      chainId: string;
      rootImageId: number | null;
      rootImageUrl: string | null;
      rootImageAddress: string | null;
    }>
  >(Prisma.sql`
    SELECT r.chainId AS chainId,
           i.id      AS rootImageId,
           i.url     AS rootImageUrl,
           i.address AS rootImageAddress
    FROM Response r
    JOIN Chain c ON c.id = r.chainId
    LEFT JOIN Image i ON i.id = c.rootImageId
    WHERE r.id = ${responseId}
    LIMIT 1
  `);

  if (!startRows.length) return [];
  const { chainId, rootImageId, rootImageUrl, rootImageAddress } =
    startRows[0]!;

  const responseRows = await db.$queryRaw<
    Array<{ id: number; prompt: string; url: string; step: number }>
  >(Prisma.sql`
    SELECT id, prompt, url, step
    FROM Response
    WHERE chainId = ${chainId} AND deletedAt IS NULL
    ORDER BY step ASC
  `);

  const items: ChainItem[] = [];
  if (rootImageId) {
    items.push({
      id: `source-${rootImageId}`,
      type: "source",
      prompt: null,
      url: rootImageUrl ?? "",
      sourceImage: {
        id: rootImageId,
        url: rootImageUrl ?? "",
        address: rootImageAddress,
      },
    });
  }

  for (const r of responseRows) {
    items.push({
      id: r.id,
      type: "response",
      prompt: r.prompt,
      url: r.url,
      step: r.step,
    });
  }

  return items;
}

export const userRouter = createTRPCRouter({
  getUserInfoById: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
      },
    });
  }),

  // Simplified profile: concise counts under the new schema
  getUserProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [user] = await Promise.all([
      ctx.db.$queryRaw<
        Array<{
          id: string;
          name: string | null;
          email: string | null;
          image: string | null;
          bio: string | null;
        }>
      >(Prisma.sql`
        SELECT id, name, email, image, bio
        FROM User
        WHERE id = ${userId}
        LIMIT 1
      `),
    ]);

    const [imagesRow, responsesRow, sharesRow, likesRow, commentsRow] =
      await Promise.all([
        ctx.db.$queryRaw<Array<{ cnt: number }>>(Prisma.sql`
        SELECT COUNT(*) AS cnt FROM Image WHERE createdById = ${userId} AND deletedAt IS NULL
      `),
        ctx.db.$queryRaw<Array<{ cnt: number }>>(Prisma.sql`
        SELECT COUNT(*) AS cnt FROM Response WHERE createdById = ${userId} AND deletedAt IS NULL
      `),
        ctx.db.$queryRaw<Array<{ cnt: number }>>(Prisma.sql`
        SELECT COUNT(*) AS cnt FROM Share WHERE sharedById = ${userId} AND deletedAt IS NULL
      `),
        // total likes the user has given (responses + shares)
        ctx.db.$queryRaw<Array<{ cnt: number }>>(Prisma.sql`
        SELECT (
          (SELECT COUNT(*) FROM ResponseLike WHERE userId = ${userId}) +
          (SELECT COUNT(*) FROM ShareLike WHERE userId = ${userId})
        ) AS cnt
      `),
        // total comments the user has authored (responses + shares)
        ctx.db.$queryRaw<Array<{ cnt: number }>>(Prisma.sql`
        SELECT (
          (SELECT COUNT(*) FROM ResponseComment WHERE authorId = ${userId} AND deletedAt IS NULL) +
          (SELECT COUNT(*) FROM ShareComment WHERE authorId = ${userId} AND deletedAt IS NULL)
        ) AS cnt
      `),
      ]);

    const u = user?.[0];
    return {
      id: userId,
      name: u?.name ?? null,
      email: u?.email ?? null,
      image: u?.image ?? null,
      bio: u?.bio ?? null,
      stats: {
        images: imagesRow[0]?.cnt ?? 0,
        responses: responsesRow[0]?.cnt ?? 0,
        shares: sharesRow[0]?.cnt ?? 0,
        likes: likesRow[0]?.cnt ?? 0,
        comments: commentsRow[0]?.cnt ?? 0,
      },
    };
  }),

  // Fetch a response with its chain and latest share (if any)
  getUserResponseById: protectedProcedure
    .input(z.object({ responseId: z.number() }))
    .query(async ({ ctx, input }) => {
      const baseRows = await ctx.db.$queryRaw<
        Array<{
          id: number;
          prompt: string;
          url: string;
          createdAt: Date;
          createdById: string;
          chainId: string;
          rootImageId: number | null;
          rootImageUrl: string | null;
          rootImageAddress: string | null;
        }>
      >(Prisma.sql`
        SELECT r.id, r.prompt, r.url, r.createdAt, r.createdById, r.chainId,
               i.id AS rootImageId, i.url AS rootImageUrl, i.address AS rootImageAddress
        FROM Response r
        JOIN Chain c ON c.id = r.chainId
        LEFT JOIN Image i ON i.id = c.rootImageId
        WHERE r.id = ${input.responseId} AND r.deletedAt IS NULL
        LIMIT 1
      `);

      if (!baseRows.length) return null;
      const base = baseRows[0]!;
      const isOwner = base.createdById === ctx.session.user.id;

      const shareRows = await ctx.db.$queryRaw<
        Array<{
          id: string;
          title: string;
          visibility: "PUBLIC" | "PRIVATE";
          createdAt: Date;
          sharedById: string;
          sharedByName: string | null;
          sharedByImage: string | null;
        }>
      >(Prisma.sql`
        SELECT s.id, s.title, s.visibility, s.createdAt,
               u.id AS sharedById, u.name AS sharedByName, u.image AS sharedByImage
        FROM Share s
        JOIN User u ON u.id = s.sharedById
        WHERE s.chainId = ${base.chainId} AND s.deletedAt IS NULL
        ORDER BY s.createdAt DESC
        LIMIT 1
      `);

      let canAccess = isOwner;
      let sharePayload: {
        id: string;
        title: string;
        visibility: "PUBLIC" | "PRIVATE";
        createdAt: Date;
        sharedBy: { id: string; name: string | null; image: string | null };
        recipients: Array<{ id: string; name: string | null }>;
        comments: Array<{
          id: string;
          content: string;
          createdAt: Date;
          author: { id: string; name: string | null; image: string | null };
        }>;
        _count: { likes: number; comments: number };
      } | null = null;

      if (shareRows.length) {
        const s = shareRows[0]!;
        const recipients = await ctx.db.$queryRaw<
          Array<{ id: string; name: string | null }>
        >(Prisma.sql`
          SELECT u.id, u.name
          FROM ShareRecipient sr
          JOIN User u ON u.id = sr.userId
          WHERE sr.shareId = ${s.id}
        `);
        const comments = await ctx.db.$queryRaw<
          Array<{
            id: string;
            content: string;
            createdAt: Date;
            authorId: string;
            authorName: string | null;
            authorImage: string | null;
          }>
        >(Prisma.sql`
          SELECT sc.id, sc.content, sc.createdAt, u.id AS authorId, u.name AS authorName, u.image AS authorImage
          FROM ShareComment sc
          JOIN User u ON u.id = sc.authorId
          WHERE sc.shareId = ${s.id} AND sc.deletedAt IS NULL
          ORDER BY sc.createdAt DESC
        `);
        const [likesCountRows, commentsCountRows] = await Promise.all([
          ctx.db.$queryRaw<Array<{ cnt: number }>>(
            Prisma.sql`SELECT COUNT(*) AS cnt FROM ShareLike WHERE shareId = ${s.id}`,
          ),
          ctx.db.$queryRaw<Array<{ cnt: number }>>(
            Prisma.sql`SELECT COUNT(*) AS cnt FROM ShareComment WHERE shareId = ${s.id} AND deletedAt IS NULL`,
          ),
        ]);

        canAccess =
          isOwner ||
          s.visibility === "PUBLIC" ||
          recipients.some((r) => r.id === ctx.session.user.id);

        sharePayload = {
          id: s.id,
          title: s.title,
          visibility: s.visibility,
          createdAt: s.createdAt,
          sharedBy: {
            id: s.sharedById,
            name: s.sharedByName,
            image: s.sharedByImage,
          },
          recipients,
          comments: comments.map((c) => ({
            id: c.id,
            content: c.content,
            createdAt: c.createdAt,
            author: {
              id: c.authorId,
              name: c.authorName,
              image: c.authorImage,
            },
          })),
          _count: {
            likes: likesCountRows[0]?.cnt ?? 0,
            comments: commentsCountRows[0]?.cnt ?? 0,
          },
        };
      }

      if (!canAccess) return null;

      const chainItems = await buildResponseChain(ctx.db, base.id);

      return {
        chain: {
          id: base.chainId,
          rootImage: base.rootImageId
            ? {
                id: base.rootImageId,
                url: base.rootImageUrl ?? "",
                address: base.rootImageAddress,
              }
            : null,
          responses: chainItems,
        },
        share: sharePayload ?? {
          id: `unshared-${base.id}`,
          title: "",
          visibility: "PRIVATE" as const,
          createdAt: base.createdAt,
          sharedBy: {
            id: ctx.session.user.id,
            name: ctx.session.user.name,
            image: ctx.session.user.image,
          },
          recipients: [],
          comments: [],
          _count: { likes: 0, comments: 0 },
        },
      };
    }),
});
