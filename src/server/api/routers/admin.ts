import { createTRPCRouter, adminProcedure } from "../trpc";

export const adminRouter = createTRPCRouter({
  getUsers: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany();
  }),
  getResponses: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.response.findMany();
  }),
  getImages: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.images.findMany();
  }),
  getSharedPosts: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.sharedChain.findMany();
  }),
  getSharedResponses: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.like.findMany();
  }),
  getSharedImages: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.comment.findMany();
  }),
});
