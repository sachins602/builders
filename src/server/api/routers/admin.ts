import { createTRPCRouter, adminProcedure } from "../trpc";
import { z } from "zod";
import { UserRole } from "@prisma/client";

function formatDate(date: Date, type: "month" | "day") {
  if (type === "month") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
  // type === "day"
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getLastNMonths(n: number) {
  const months: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(formatDate(d, "month"));
  }
  return months;
}

function getLastNDays(n: number) {
  const days: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    days.push(formatDate(d, "day"));
  }
  return days;
}

export const adminRouter = createTRPCRouter({
  // Simple lists
  listUsers: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany();
  }),
  listResponses: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.response.findMany();
  }),
  listImages: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.image.findMany();
  }),
  listShares: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.share.findMany();
  }),

  // Assign admin privileges to a user by email
  assignAdmin: adminProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        throw new Error("User not found with this email address");
      }

      if (user.role === UserRole.ADMIN) {
        throw new Error("User is already an admin");
      }

      const updatedUser = await ctx.db.user.update({
        where: { email: input.email },
        data: { role: UserRole.ADMIN },
      });

      return updatedUser;
    }),

  // Users registered per month (last 12 months)
  usersPerMonth: adminProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.user.findMany({
      select: { createdAt: true },
    });
    const months = getLastNMonths(12);
    const counts: Record<string, number> = Object.fromEntries(
      months.map((m) => [m, 0]),
    );
    users.forEach((u) => {
      const month = formatDate(u.createdAt, "month");
      if (counts[month] !== undefined) counts[month]++;
    });
    return months.map((month) => ({ month, count: counts[month] }));
  }),

  // Images generated per day (last 30 days)
  imagesPerDay: adminProcedure.query(async ({ ctx }) => {
    const images = await ctx.db.image.findMany({
      select: { createdAt: true },
    });
    const days = getLastNDays(30);
    const counts: Record<string, number> = Object.fromEntries(
      days.map((d) => [d, 0]),
    );
    images.forEach((img) => {
      const day = formatDate(img.createdAt, "day");
      if (counts[day] !== undefined) counts[day]++;
    });
    return days.map((day) => ({ day, count: counts[day] }));
  }),

  // Responses per day (last 30 days)
  responsesPerDay: adminProcedure.query(async ({ ctx }) => {
    const responses = await ctx.db.response.findMany({
      select: { createdAt: true },
    });
    const days = getLastNDays(30);
    const counts: Record<string, number> = Object.fromEntries(
      days.map((d) => [d, 0]),
    );
    responses.forEach((r) => {
      const day = formatDate(r.createdAt, "day");
      if (counts[day] !== undefined) counts[day]++;
    });
    return days.map((day) => ({ day, count: counts[day] }));
  }),

  // Top users by number of posts, likes, comments
  topUsers: adminProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            images: true,
            responses: true,
            shareLikes: true,
            shareComments: true,
            responseLikes: true,
            responseComments: true,
          },
        },
      },
    });
    return users.map((u) => {
      const posts = u._count.images + u._count.responses;
      const likes = u._count.shareLikes + u._count.responseLikes;
      const comments = u._count.shareComments + u._count.responseComments;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        posts,
        likes,
        comments,
      };
    });
  }),

  // Engagement per shared post (likes/comments)
  engagementPerShare: adminProcedure.query(async ({ ctx }) => {
    const posts = await ctx.db.share.findMany({
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });
    return posts.map((p) => ({
      id: p.id,
      title: p.title,
      likes: p._count.likes,
      comments: p._count.comments,
    }));
  }),

  // Shares per day (last 30 days)
  sharesPerDay: adminProcedure.query(async ({ ctx }) => {
    const shares = await ctx.db.share.findMany({
      select: { createdAt: true },
    });
    const days = getLastNDays(30);
    const counts: Record<string, number> = Object.fromEntries(
      days.map((d) => [d, 0]),
    );
    shares.forEach((s) => {
      const day = formatDate(s.createdAt, "day");
      if (counts[day] !== undefined) counts[day]++;
    });
    return days.map((day) => ({ day, count: counts[day] }));
  }),
});
