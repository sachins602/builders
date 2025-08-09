import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { Visibility, OrganizationMemberRole } from "@prisma/client";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
// Local types for shaping query results (avoid implicit any)
type UserLite = { id: string; name: string | null; image?: string | null };
type RootImageLite = {
  id: number;
  url: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
};
type ResponseLite = {
  id: number;
  prompt: string;
  url: string;
  step: number;
  createdAt: Date;
  deletedAt: Date | null;
};
type ChainWithResponses = {
  id: string;
  rootImage: RootImageLite;
  responses: ResponseLite[];
};
type ShareWithChain = {
  id: string;
  title: string;
  description: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  sharedById: string;
  chain: ChainWithResponses;
  sharedBy: UserLite;
  recipients?: { user: { id: string; name: string | null } }[];
  comments?: { author: UserLite }[];
  _count?: { likes: number; comments: number };
};

export const communityRouter = createTRPCRouter({
  // Simple feed of shares using Chain-based schema
  getFeedSimple: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        sort: z.enum(["latest", "popular"]).default("latest"),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, sort, cursor } = input;
      const currentUserId = ctx.session.user.id;

      const whereClause: Prisma.ShareWhereInput = {
        deletedAt: null,
        OR: [
          { visibility: Visibility.PUBLIC },
          { sharedById: currentUserId },
          {
            visibility: Visibility.PRIVATE,
            recipients: { some: { userId: currentUserId } },
          },
        ],
      };

      const shared = await ctx.db.share.findMany({
        where: whereClause,
        include: {
          chain: {
            include: {
              rootImage: true,
              responses: {
                where: { deletedAt: null },
                orderBy: { step: "asc" },
              },
            },
          },
          sharedBy: { select: { id: true, name: true, image: true } },
        },
        orderBy:
          sort === "popular"
            ? [{ likeCount: "desc" }, { createdAt: "desc" }]
            : [{ createdAt: "desc" }],
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
      });

      let nextCursor: string | undefined = undefined;
      if (shared.length > limit) {
        const next = shared.pop();
        nextCursor = next?.id;
      }

      const shareIds = shared.map((s) => s.id);
      const likes = await ctx.db.shareLike.findMany({
        where: { userId: currentUserId, shareId: { in: shareIds } },
        select: { shareId: true },
      });
      const likedSet = new Set(likes.map((l) => l.shareId));

      const items = shared.map((s) => {
        const responses = s.chain.responses;
        const lastResponse = responses[responses.length - 1];
        return {
          id: s.id,
          title: s.title,
          visibility: s.visibility,
          createdAt: s.createdAt,
          sharedBy: s.sharedBy,
          heroImageUrl: lastResponse?.url ?? s.chain.rootImage.url,
          rootImage: s.chain.rootImage,
          prompt: lastResponse?.prompt ?? null,
          stats: {
            views: s.viewCount,
            likes: s.likeCount,
            comments: s.commentCount,
          },
          likedByMe: likedSet.has(s.id),
        };
      });

      return { items, nextCursor };
    }),
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
        chainId: z.string(),
        title: z.string().min(1).max(100),
        description: z.string().optional(),
        visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
        selectedUserIds: z.array(z.string()).optional(), // For private sharing
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { chainId, title, description, visibility, selectedUserIds } =
        input;

      // Check if chain exists and belongs to user
      const chain = await ctx.db.chain.findFirst({
        where: {
          id: chainId,
          deletedAt: null,
          createdById: ctx.session.user.id,
        },
      });

      if (!chain) {
        throw new Error("Chain not found or not owned by user");
      }

      // Validate private sharing requirements
      if (
        visibility === "PRIVATE" &&
        (!selectedUserIds || selectedUserIds.length === 0)
      ) {
        throw new Error("Please select at least one user for private sharing");
      }

      // Create share
      const share = await ctx.db.share.create({
        data: {
          title,
          description,
          visibility,
          chainId,
          sharedById: ctx.session.user.id,
        },
      });

      // If private sharing, create recipients
      if (
        visibility === "PRIVATE" &&
        selectedUserIds &&
        selectedUserIds.length > 0
      ) {
        await ctx.db.shareRecipient.createMany({
          data: selectedUserIds.map((userId) => ({
            shareId: share.id,
            userId,
          })),
        });
      }

      return share;
    }),

  // Simple paginated shares list
  getSharedPosts: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;
      const currentUserId = ctx.session.user.id;

      const whereClause: Prisma.ShareWhereInput = {
        deletedAt: null,
        OR: [
          { visibility: Visibility.PUBLIC },
          ...(currentUserId
            ? [
                {
                  visibility: Visibility.PRIVATE,
                  recipients: { some: { userId: currentUserId } },
                },
                { visibility: Visibility.PRIVATE, sharedById: currentUserId },
              ]
            : []),
        ],
      };

      const shares = await ctx.db.share.findMany({
        where: whereClause,
        include: {
          chain: {
            include: {
              rootImage: true,
              responses: {
                where: { deletedAt: null },
                orderBy: { step: "asc" },
              },
            },
          },
          sharedBy: { select: { id: true, name: true, image: true } },
          recipients: {
            include: { user: { select: { id: true, name: true } } },
          },
          comments: {
            where: { deletedAt: null },
            include: {
              author: { select: { id: true, name: true, image: true } },
            },
            orderBy: { createdAt: "asc" },
          },
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (shares.length > limit) {
        const nextItem = shares.pop();
        nextCursor = nextItem?.id;
      }

      const itemsWithFullChain = shares.map((post) => ({
        ...post,
        chain: post.chain,
      }));

      return {
        items: itemsWithFullChain,
        nextCursor,
      };
    }),

  getSharedPopularPosts: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;
      const currentUserId = ctx.session.user.id;

      const whereClause: Prisma.ShareWhereInput = {
        deletedAt: null,
        likeCount: { gt: 0 },
        OR: [
          { visibility: Visibility.PUBLIC },
          ...(currentUserId
            ? [
                {
                  visibility: Visibility.PRIVATE,
                  recipients: { some: { userId: currentUserId } },
                },
                { visibility: Visibility.PRIVATE, sharedById: currentUserId },
              ]
            : []),
        ],
      };

      const shares = await ctx.db.share.findMany({
        where: whereClause,
        include: {
          chain: {
            include: {
              rootImage: true,
              responses: {
                where: { deletedAt: null },
                orderBy: { step: "asc" },
              },
            },
          },
          sharedBy: { select: { id: true, name: true, image: true } },
          recipients: {
            include: { user: { select: { id: true, name: true } } },
          },
          comments: {
            where: { deletedAt: null },
            include: {
              author: { select: { id: true, name: true, image: true } },
            },
            orderBy: { createdAt: "asc" },
          },
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { likeCount: "desc" },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (shares.length > limit) {
        const nextItem = shares.pop();
        nextCursor = nextItem?.id;
      }

      const itemsWithFullChain = shares.map((post) => ({
        ...post,
        chain: post.chain,
      }));

      return {
        items: itemsWithFullChain,
        nextCursor,
      };
    }),
  getSharedPost: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const currentUserId = ctx.session?.user?.id;

      // Build where clause to check access permissions
      const whereClause: Prisma.ShareWhereInput = {
        id: input.id,
        deletedAt: null,
        OR: [
          { visibility: Visibility.PUBLIC },
          ...(currentUserId
            ? [
                {
                  visibility: Visibility.PRIVATE,
                  recipients: { some: { userId: currentUserId } },
                },
                { visibility: Visibility.PRIVATE, sharedById: currentUserId },
              ]
            : []),
        ],
      };

      const share = (await ctx.db.share.findFirst({
        where: whereClause,
        include: {
          chain: {
            include: {
              rootImage: true,
              responses: {
                where: { deletedAt: null },
                orderBy: { step: "asc" },
              },
            },
          },
          sharedBy: { select: { id: true, name: true, image: true } },
          comments: {
            where: { deletedAt: null },
            include: {
              author: { select: { id: true, name: true, image: true } },
            },
            orderBy: { createdAt: "asc" },
          },
          _count: { select: { likes: true, comments: true } },
        },
      })) as ShareWithChain | null;

      if (!share) {
        throw new Error("Shared post not found or access denied");
      }

      // Update view count
      await ctx.db.share.update({
        where: { id: input.id },
        data: { viewCount: { increment: 1 } },
      });

      return share;
    }),

  toggleLike: protectedProcedure
    .input(z.object({ sharedChainId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { sharedChainId } = input; // keeping arg name for backward compat
      const userId = ctx.session.user.id;

      // Check if already liked
      const existingLike = await ctx.db.shareLike.findFirst({
        where: { shareId: sharedChainId, userId },
      });

      if (existingLike) {
        // Unlike
        await ctx.db.shareLike.delete({
          where: { id: existingLike.id },
        });

        // Update count
        await ctx.db.share.update({
          where: { id: sharedChainId },
          data: { likeCount: { decrement: 1 } },
        });

        return { liked: false };
      } else {
        // Like
        await ctx.db.shareLike.create({
          data: { shareId: sharedChainId, userId },
        });

        // Update count
        await ctx.db.share.update({
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

      const comment = await ctx.db.shareComment.create({
        data: {
          content,
          shareId: sharedChainId,
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
      await ctx.db.share.update({
        where: { id: sharedChainId },
        data: { commentCount: { increment: 1 } },
      });

      return comment;
    }),

  getUserLikes: protectedProcedure
    .input(z.object({ sharedChainIds: z.array(z.string()) }))
    .query(async ({ ctx, input }) => {
      const likes = await ctx.db.shareLike.findMany({
        where: {
          shareId: { in: input.sharedChainIds },
          userId: ctx.session.user.id,
        },
        select: { shareId: true },
      });
      return likes.map((like) => like.shareId);
    }),

  getUserLikedResponses: protectedProcedure.query(async ({ ctx }) => {
    const likes = await ctx.db.shareLike.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        share: {
          where: { deletedAt: null },
          include: {
            chain: {
              include: {
                rootImage: true,
                responses: {
                  where: { deletedAt: null },
                  orderBy: { step: "asc" },
                },
              },
            },
            sharedBy: { select: { id: true, name: true, image: true } },
            recipients: {
              include: { user: { select: { id: true, name: true } } },
            },
            comments: {
              where: { deletedAt: null },
              include: {
                author: { select: { id: true, name: true, image: true } },
              },
              orderBy: { createdAt: "asc" },
            },
            _count: { select: { likes: true, comments: true } },
          },
        },
      },
    });

    return likes.map((l) => l.share).filter((s) => s !== null);
  }),

  getNearbySharedResponses: publicProcedure
    .input(
      z.object({
        lat: z.number(),
        lng: z.number(),
        radius: z.number().default(0.01), // Default ~1km radius
        limit: z.number().min(1).max(20).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { lat, lng, radius, limit } = input;
      const currentUserId = ctx.session?.user?.id;

      // Build where clause to include:
      // 1. All PUBLIC shares
      // 2. PRIVATE shares where the current user is a recipient
      // 3. PRIVATE shares created by the current user
      const whereClause: Prisma.ShareWhereInput = {
        deletedAt: null,
        OR: [
          { visibility: Visibility.PUBLIC },
          ...(currentUserId
            ? [
                {
                  visibility: Visibility.PRIVATE,
                  recipients: { some: { userId: currentUserId } },
                },
                { visibility: Visibility.PRIVATE, sharedById: currentUserId },
              ]
            : []),
        ],
      };

      const nearbyShares = (await ctx.db.share.findMany({
        where: {
          ...whereClause,
          chain: {
            rootImage: {
              lat: { gte: lat - radius, lte: lat + radius },
              lng: { gte: lng - radius, lte: lng + radius },
              deletedAt: null,
            },
          },
        },
        include: {
          chain: {
            include: {
              rootImage: {
                select: {
                  id: true,
                  address: true,
                  lat: true,
                  lng: true,
                  url: true,
                },
              },
              responses: {
                where: { deletedAt: null },
                orderBy: { step: "asc" },
              },
            },
          },
          sharedBy: { select: { id: true, name: true, image: true } },
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      })) as ShareWithChain[];

      // Calculate distance for each response and sort by proximity
      const responsesWithDistance = nearbyShares.map((share) => {
        const sourceLat = share.chain.rootImage?.lat;
        const sourceLng = share.chain.rootImage?.lng;

        let distance = Infinity;
        if (sourceLat != null && sourceLng != null) {
          const R = 6371;
          const dLat = ((sourceLat - lat) * Math.PI) / 180;
          const dLng = ((sourceLng - lng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat * Math.PI) / 180) *
              Math.cos((sourceLat * Math.PI) / 180) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distance = R * c;
        }

        return {
          ...share,
          distance: Math.round(distance * 100) / 100,
        };
      });

      // Sort by distance (closest first)
      responsesWithDistance.sort((a, b) => a.distance - b.distance);

      return responsesWithDistance;
    }),

  // Organization Management Endpoints

  createOrganization: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().min(1).max(250),
        email: z.string().email().optional(),
        website: z.string().url().optional(),
        phone: z.string().optional(),
        avatar: z.string().url().optional(),
        imageUrl: z.string().url().optional(),
        address: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        neighbourhood: z.string().optional(),
        borough: z.string().optional(),
        city: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const organization = await ctx.db.organization.create({
        data: {
          ...input,
          createdById: ctx.session.user.id,
        },
      });

      // Automatically make the creator a member with "owner" role
      await ctx.db.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: ctx.session.user.id,
          role: "owner",
        },
      });

      return organization;
    }),

  getOrganizations: publicProcedure
    .input(
      z.object({
        userLat: z.number().optional(),
        userLng: z.number().optional(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { userLat, userLng, limit, cursor } = input;
      const currentUserId = ctx.session?.user?.id;

      const organizations = await ctx.db.organization.findMany({
        where: {
          deletedAt: null,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          _count: {
            select: {
              members: {
                where: {
                  leftAt: null, // Only count active members
                },
              },
            },
          },
          ...(currentUserId && {
            members: {
              where: {
                userId: currentUserId,
                leftAt: null,
              },
              select: {
                id: true,
                role: true,
                joinedAt: true,
              },
            },
          }),
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (organizations.length > limit) {
        const nextItem = organizations.pop();
        nextCursor = nextItem?.id;
      }

      // Group organizations by location if user coordinates are provided
      const groupedOrganizations =
        userLat && userLng
          ? {
              neighbourhood: [] as typeof organizations,
              borough: [] as typeof organizations,
              city: [] as typeof organizations,
              other: [] as typeof organizations,
            }
          : null;

      if (groupedOrganizations && userLat && userLng) {
        organizations.forEach((org) => {
          if (org.lat && org.lng) {
            // Calculate distance (simple approximation)
            const distance = Math.sqrt(
              Math.pow(org.lat - userLat, 2) + Math.pow(org.lng - userLng, 2),
            );

            // Group by proximity (these thresholds can be adjusted)
            if (distance < 0.01) {
              // ~1km
              groupedOrganizations.neighbourhood.push(org);
            } else if (distance < 0.05) {
              // ~5km
              groupedOrganizations.borough.push(org);
            } else if (distance < 0.1) {
              // ~10km
              groupedOrganizations.city.push(org);
            } else {
              groupedOrganizations.other.push(org);
            }
          } else {
            groupedOrganizations.other.push(org);
          }
        });
      }

      return {
        items: organizations,
        grouped: groupedOrganizations,
        nextCursor,
      };
    }),

  getOrganization: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const currentUserId = ctx.session?.user?.id;

      const organization = await ctx.db.organization.findFirst({
        where: {
          id: input.id,
          deletedAt: null,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          members: {
            where: {
              leftAt: null,
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
            orderBy: {
              joinedAt: "asc",
            },
          },
          _count: {
            select: {
              members: {
                where: {
                  leftAt: null,
                },
              },
            },
          },
        },
      });

      if (!organization) {
        throw new Error("Organization not found");
      }

      // Check if current user is a member
      const currentUserMembership = currentUserId
        ? organization.members.find((m) => m.userId === currentUserId)
        : null;

      return {
        ...organization,
        currentUserMembership,
      };
    }),

  joinOrganization: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = input;
      const userId = ctx.session.user.id;

      // Check if organization exists
      const organization = await ctx.db.organization.findFirst({
        where: {
          id: organizationId,
          deletedAt: null,
        },
      });

      if (!organization) {
        throw new Error("Organization not found");
      }

      // Check if user is already a member (and hasn't left)
      const existingMembership = await ctx.db.organizationMember.findFirst({
        where: {
          organizationId,
          userId,
          leftAt: null,
        },
      });

      if (existingMembership) {
        throw new Error("User is already a member of this organization");
      }

      // Check if user was previously a member but left
      const previousMembership = await ctx.db.organizationMember.findFirst({
        where: {
          organizationId,
          userId,
          leftAt: { not: null },
        },
      });

      if (previousMembership) {
        // Rejoin by clearing the leftAt timestamp
        await ctx.db.organizationMember.update({
          where: { id: previousMembership.id },
          data: {
            leftAt: null,
            joinedAt: new Date(), // Update join date
          },
        });
      } else {
        // Create new membership
        await ctx.db.organizationMember.create({
          data: {
            organizationId,
            userId,
            role: "member",
          },
        });
      }

      return { success: true };
    }),

  leaveOrganization: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = input;
      const userId = ctx.session.user.id;

      // Check if user is a member
      const membership = await ctx.db.organizationMember.findFirst({
        where: {
          organizationId,
          userId,
          leftAt: null,
        },
      });

      if (!membership) {
        throw new Error("User is not a member of this organization");
      }

      // Prevent owner from leaving (they need to transfer ownership first)
      if (membership.role === "owner") {
        throw new Error(
          "Organization owner cannot leave. Please transfer ownership first.",
        );
      }

      // Mark as left
      await ctx.db.organizationMember.update({
        where: { id: membership.id },
        data: { leftAt: new Date() },
      });

      return { success: true };
    }),

  getUserOrganizations: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.organizationMember.findMany({
      where: {
        userId: ctx.session.user.id,
        leftAt: null,
      },
      include: {
        organization: {
          include: {
            _count: {
              select: {
                members: {
                  where: {
                    leftAt: null,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: "desc",
      },
    });

    return memberships.map((m) => ({
      membership: {
        id: m.id,
        role: m.role,
        joinedAt: m.joinedAt,
      },
      organization: m.organization,
    }));
  }),
});
