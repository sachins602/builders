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
        responseId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      //  share the response
    }),
});
