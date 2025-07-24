import { createTRPCRouter, protectedProcedure } from "../trpc";

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
});
