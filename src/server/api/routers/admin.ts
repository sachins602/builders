import { createTRPCRouter, protectedProcedure } from "../trpc";

export const adminRouter = createTRPCRouter({
  getUsers: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany();
  }),
  getResponses: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.response.findMany();
  }),
  getImages: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.images.findMany();
  }),
  getSharedPosts: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.sharedChain.findMany();
  }),
  getSharedResponses: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.like.findMany();
  }),
  getSharedImages: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.comment.findMany();
  }),
});
