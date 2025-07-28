import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Prisma } from "@prisma/client";

// Helper function to build the full response chain
async function buildResponseChain(
  db: Prisma.TransactionClient,
  response: {
    id: number;
    prompt: string;
    url: string;
    sourceImage: {
      id: number;
      url: string;
      address: string | null;
    } | null;
    previousResponseId: number | null;
  },
) {
  const responseChain: Array<{
    id: string | number;
    type: "source" | "response";
    prompt: string | null;
    url: string;
    sourceImage?: {
      id: number;
      url: string;
      address?: string | null;
    } | null;
    previousResponseId?: number | null;
  }> = [];

  // Add source image if it exists
  if (response.sourceImage) {
    responseChain.push({
      id: `source-${response.sourceImage.id}`,
      type: "source",
      prompt: null,
      url: response.sourceImage.url,
      sourceImage: {
        id: response.sourceImage.id,
        url: response.sourceImage.url,
        address: response.sourceImage.address,
      },
    });
  }

  // Build the chain by following previousResponseId using recursive CTE

  // Collect all responses in the chain using a recursive CTE to avoid N+1 queries
  const rawResponses = await db.$queryRaw<
    Array<{
      id: number;
      prompt: string;
      url: string;
      sourceImageId: number | null;
      sourceImageUrl: string | null;
      sourceImageAddress: string | null;
      previousResponseId: number | null;
    }>
  >(Prisma.sql`
    WITH RECURSIVE ResponseChain AS (
      SELECT 
        r.id, r.prompt, r.url, r.previousResponseId,
        si.id AS sourceImageId, si.url AS sourceImageUrl, si.address AS sourceImageAddress
      FROM response r
      LEFT JOIN Images si ON r.sourceImageId = si.id
      WHERE r.id = ${response.id}
      UNION ALL
      SELECT 
        r.id, r.prompt, r.url, r.previousResponseId,
        si.id AS sourceImageId, si.url AS sourceImageUrl, si.address AS sourceImageAddress
      FROM response r
      LEFT JOIN Images si ON r.sourceImageId = si.id
      INNER JOIN ResponseChain rc ON r.id = rc.previousResponseId
    )
    SELECT * FROM ResponseChain ORDER BY id;
  `);

  // Process the results to build the chainResponses array
  // The CTE returns responses in chronological order (oldest first), which is what we want
  const chainResponses = rawResponses.map((resp) => ({
    id: resp.id,
    prompt: resp.prompt,
    url: resp.url,
    sourceImage: resp.sourceImageId
      ? {
          id: resp.sourceImageId,
          url: resp.sourceImageUrl!,
          address: resp.sourceImageAddress,
        }
      : null,
    previousResponseId: resp.previousResponseId,
  }));

  // Add all responses to the chain
  chainResponses.forEach((resp) => {
    responseChain.push({
      id: resp.id,
      type: "response",
      prompt: resp.prompt,
      url: resp.url,
      sourceImage: resp.sourceImage,
      previousResponseId: resp.previousResponseId,
    });
  });

  return responseChain;
}

export const userRouter = createTRPCRouter({
  getUserInfoById: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findUnique({
      where: {
        id: ctx.session.user.id,
      },
    });
  }),

  getUserProfile: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        _count: {
          select: {
            images: {
              where: { deletedAt: null },
            },
            responses: {
              where: { deletedAt: null },
            },
            sharedChains: {
              where: { deletedAt: null },
            },
            likes: true,
            comments: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });
  }),

  getUserResponseById: protectedProcedure
    .input(
      z.object({
        responseId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // First, find the response and its associated shared chain
      const response = await ctx.db.response.findUnique({
        where: {
          id: input.responseId,
          deletedAt: null,
        },
        include: {
          sourceImage: true,
          sharedChains: {
            where: { deletedAt: null },
            include: {
              sharedBy: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
              sharedToUsers: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              comments: {
                where: { deletedAt: null },
                include: {
                  author: {
                    select: {
                      id: true,
                      name: true,
                      image: true,
                    },
                  },
                },
                orderBy: { createdAt: "desc" },
              },
              _count: {
                select: {
                  likes: true,
                  comments: true,
                },
              },
            },
          },
        },
      });

      if (!response) return null;

      // Check if user owns this response
      const isOwner = response.createdById === ctx.session.user.id;

      // Find the active shared chain that contains this response
      // Filter out deleted chains and select the most recent one if multiple exist
      const activeSharedChains = response.sharedChains.filter(
        (chain) => chain.deletedAt === null,
      );
      const sharedChain =
        activeSharedChains.length > 0
          ? activeSharedChains.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )[0]
          : null;

      // If there's no shared chain, only the owner can access it
      if (!sharedChain) {
        if (!isOwner) return null;

        // Create a mock shared chain structure for owner's unshared response
        const mockSharedChain = {
          id: `unshared-${response.id}`,
          title: "",
          description: null,
          isPublic: false,
          viewCount: 0,
          likeCount: 0,
          commentCount: 0,
          createdAt: response.createdAt,
          updatedAt: response.updatedAt,
          deletedAt: null,
          sharedBy: {
            id: ctx.session.user.id,
            name: ctx.session.user.name,
            image: ctx.session.user.image,
          },
          sharedToUsers: [],
          comments: [],
          _count: {
            likes: 0,
            comments: 0,
          },
        };

        // Build response chain for unshared response
        const responseChain = await buildResponseChain(ctx.db, response);

        return {
          id: mockSharedChain.id,
          title: mockSharedChain.title,
          description: mockSharedChain.description,
          isPublic: mockSharedChain.isPublic,
          viewCount: mockSharedChain.viewCount,
          likeCount: mockSharedChain.likeCount,
          commentCount: mockSharedChain.commentCount,
          createdAt: mockSharedChain.createdAt,
          response: {
            id: response.id,
            prompt: response.prompt,
            url: response.url,
            sourceImage: response.sourceImage
              ? {
                  id: response.sourceImage.id,
                  url: response.sourceImage.url,
                  address: response.sourceImage.address,
                }
              : null,
          },
          sharedBy: mockSharedChain.sharedBy,
          sharedToUsers: mockSharedChain.sharedToUsers,
          comments: mockSharedChain.comments,
          _count: mockSharedChain._count,
          responseChain,
        };
      }

      // Check access control for shared chains: user can access if:
      // 1. They created the shared chain
      // 2. The chain is public
      // 3. The chain is shared with them
      const canAccess =
        sharedChain.sharedBy.id === ctx.session.user.id ||
        sharedChain.isPublic ||
        sharedChain.sharedToUsers.some(
          (share) => share.user.id === ctx.session.user.id,
        );

      if (!canAccess) return null;

      // Build response chain for shared response
      const responseChain = await buildResponseChain(ctx.db, response);

      // Return the data in the format expected by CommunityPost
      return {
        id: sharedChain.id,
        title: sharedChain.title,
        description: sharedChain.description,
        isPublic: sharedChain.isPublic,
        viewCount: sharedChain.viewCount,
        likeCount: sharedChain.likeCount,
        commentCount: sharedChain.commentCount,
        createdAt: sharedChain.createdAt,
        response: {
          id: response.id,
          prompt: response.prompt,
          url: response.url,
          sourceImage: response.sourceImage
            ? {
                id: response.sourceImage.id,
                url: response.sourceImage.url,
                address: response.sourceImage.address,
              }
            : null,
        },
        sharedBy: sharedChain.sharedBy,
        sharedToUsers: sharedChain.sharedToUsers,
        comments: sharedChain.comments,
        _count: sharedChain._count,
        responseChain,
      };
    }),
});
