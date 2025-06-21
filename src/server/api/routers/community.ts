import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const communityRouter = createTRPCRouter({
  shareResponse: protectedProcedure
    .input(
      z.object({
        responseId: z.number(),
        title: z.string().min(1).max(100),
        description: z.string().optional(),
        isPublic: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { responseId, title, description, isPublic } = input;

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

      const sharedChains = await ctx.db.sharedChain.findMany({
        where: {
          isPublic: true,
          deletedAt: null,
        },
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
      const sharedChain = await ctx.db.sharedChain.findFirst({
        where: {
          id: input.id,
          isPublic: true,
          deletedAt: null,
        },
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
        throw new Error("Shared post not found");
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
