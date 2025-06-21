import { responseRouter } from "~/server/api/routers/response";
import { openaiRouter } from "~/server/api/routers/openai";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { communityRouter } from "./routers/community";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  response: responseRouter,
  openai: openaiRouter,
  community: communityRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
