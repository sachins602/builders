import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const communityRouter = createTRPCRouter({
  // Search users for sharing
  searchUsers: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const users = await ctx.db.user.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: input.query } },
                { email: { contains: input.query } },
              ],
            },
            { id: { not: ctx.session.user.id } }, // Exclude current user
            { deletedAt: null },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
        take: 10,
      });

      return users;
    }),

  shareResponse: protectedProcedure
    .input(
      z.object({
        responseId: z.number(),
        title: z.string().min(1).max(100),
        description: z.string().optional(),
        isPublic: z.boolean().default(true),
        selectedUserIds: z.array(z.string()).optional(), // For private sharing
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { responseId, title, description, isPublic, selectedUserIds } =
        input;

      // Check if response exists and belongs to user
      const response = await ctx.db.response.findFirst({
        where: {
          id: responseId,
          createdById: ctx.session.user.id,
        },
      });

      if (!response) {
        throw new Error("Response not found or not owned by user");
      }

      // Validate private sharing requirements
      if (!isPublic && (!selectedUserIds || selectedUserIds.length === 0)) {
        throw new Error("Please select at least one user for private sharing");
      }

      // Create shared chain
      const sharedChain = await ctx.db.sharedChain.create({
        data: {
          title,
          description,
          isPublic,
          responseId,
          sharedById: ctx.session.user.id,
        },
      });

      // If private sharing, create SharedChainUser records
      if (!isPublic && selectedUserIds && selectedUserIds.length > 0) {
        await ctx.db.sharedChainUser.createMany({
          data: selectedUserIds.map((userId) => ({
            sharedChainId: sharedChain.id,
            userId,
          })),
        });
      }

      return sharedChain;
    }),

  getSharedPosts: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;
      const currentUserId = ctx.session?.user?.id;

      // Build where clause to include both public posts and private posts shared to the current user
      const whereClause = {
        deletedAt: null,
        OR: [
          { isPublic: true },
          ...(currentUserId
            ? [
                {
                  isPublic: false,
                  sharedToUsers: {
                    some: {
                      userId: currentUserId,
                    },
                  },
                },
              ]
            : []),
        ],
      };

      const sharedChains = await ctx.db.sharedChain.findMany({
        where: whereClause,
        include: {
          response: {
            include: {
              sourceImage: true,
            },
          },
          sharedBy: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (sharedChains.length > limit) {
        const nextItem = sharedChains.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: sharedChains,
        nextCursor,
      };
    }),

  getSharedPost: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const currentUserId = ctx.session?.user?.id;

      // Build where clause to check access permissions
      const whereClause = {
        id: input.id,
        deletedAt: null,
        OR: [
          { isPublic: true },
          ...(currentUserId
            ? [
                {
                  isPublic: false,
                  sharedToUsers: {
                    some: {
                      userId: currentUserId,
                    },
                  },
                },
                {
                  isPublic: false,
                  sharedById: currentUserId, // Owner can always see their own private posts
                },
              ]
            : []),
        ],
      };

      const sharedChain = await ctx.db.sharedChain.findFirst({
        where: whereClause,
        include: {
          response: {
            include: {
              sourceImage: true,
            },
          },
          sharedBy: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          comments: {
            where: {
              deletedAt: null,
            },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      if (!sharedChain) {
        throw new Error("Shared post not found or access denied");
      }

      // Update view count
      await ctx.db.sharedChain.update({
        where: { id: input.id },
        data: { viewCount: { increment: 1 } },
      });

      return sharedChain;
    }),

  toggleLike: protectedProcedure
    .input(z.object({ sharedChainId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { sharedChainId } = input;
      const userId = ctx.session.user.id;

      // Check if already liked
      const existingLike = await ctx.db.like.findFirst({
        where: {
          sharedChainId,
          userId,
        },
      });

      if (existingLike) {
        // Unlike
        await ctx.db.like.delete({
          where: { id: existingLike.id },
        });

        // Update count
        await ctx.db.sharedChain.update({
          where: { id: sharedChainId },
          data: { likeCount: { decrement: 1 } },
        });

        return { liked: false };
      } else {
        // Like
        await ctx.db.like.create({
          data: {
            sharedChainId,
            userId,
          },
        });

        // Update count
        await ctx.db.sharedChain.update({
          where: { id: sharedChainId },
          data: { likeCount: { increment: 1 } },
        });

        return { liked: true };
      }
    }),

  addComment: protectedProcedure
    .input(
      z.object({
        sharedChainId: z.string(),
        content: z.string().min(1).max(1000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { sharedChainId, content } = input;

      const comment = await ctx.db.comment.create({
        data: {
          content,
          sharedChainId,
          authorId: ctx.session.user.id,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      // Update comment count
      await ctx.db.sharedChain.update({
        where: { id: sharedChainId },
        data: { commentCount: { increment: 1 } },
      });

      return comment;
    }),

  getUserLikes: protectedProcedure
    .input(z.object({ sharedChainIds: z.array(z.string()) }))
    .query(async ({ ctx, input }) => {
      const likes = await ctx.db.like.findMany({
        where: {
          sharedChainId: { in: input.sharedChainIds },
          userId: ctx.session.user.id,
        },
        select: {
          sharedChainId: true,
        },
      });

      return likes.map((like) => like.sharedChainId);
    }),
});
