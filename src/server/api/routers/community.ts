import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import type { Prisma } from "@prisma/client";

// Helper function to get the full response chain for a given response
async function getFullResponseChain(
  db: Prisma.TransactionClient,
  responseId: number,
) {
  // Get the starting response
  const startResponse = await db.response.findUnique({
    where: { id: responseId },
    include: {
      sourceImage: true,
    },
  });

  if (!startResponse) {
    return [];
  }

  const chain: Array<{
    id: string | number;
    type: "source" | "response";
    prompt: string | null;
    url: string;
    previousResponseId: number | null;
    sourceImageId: number | null;
    sourceImage: {
      id: number;
      url: string;
      address: string | null;
    } | null;
  }> = [];

  // Build the chain backwards (from the final response to the original)
  let currentResponse = startResponse;
  const visitedIds = new Set<number>();

  while (currentResponse && !visitedIds.has(currentResponse.id)) {
    visitedIds.add(currentResponse.id);

    // Add the current response to the chain
    chain.unshift({
      id: currentResponse.id,
      type: "response",
      prompt: currentResponse.prompt,
      url: currentResponse.url,
      previousResponseId: currentResponse.previousResponseId,
      sourceImageId: currentResponse.sourceImageId,
      sourceImage: currentResponse.sourceImage
        ? {
            id: currentResponse.sourceImage.id,
            url: currentResponse.sourceImage.url,
            address: currentResponse.sourceImage.address,
          }
        : null,
    });

    // Move to the previous response in the chain
    if (currentResponse.previousResponseId) {
      const nextResponse = await db.response.findUnique({
        where: { id: currentResponse.previousResponseId },
        include: {
          sourceImage: true,
        },
      });
      currentResponse = nextResponse;
    } else {
      break; // Reached the start of the chain
    }
  }

  console.log(`Start response sourceImage:`, startResponse.sourceImage);
  console.log(`Chain before adding source:`, chain.length, "items");

  // Add the original source image at the beginning if it exists
  if (startResponse.sourceImage) {
    chain.unshift({
      id: `source-${startResponse.sourceImage.id}`,
      type: "source",
      prompt: null,
      url: startResponse.sourceImage.url,
      previousResponseId: null,
      sourceImageId: null,
      sourceImage: {
        id: startResponse.sourceImage.id,
        url: startResponse.sourceImage.url,
        address: startResponse.sourceImage.address,
      },
    });
  }

  // If no source image was found, try to find the original image by looking at the first response in the chain
  if (chain.length > 0 && !chain[0].type.includes("source")) {
    const firstResponse = chain[0];
    console.log(`First response sourceImageId:`, firstResponse.sourceImageId);
    if (firstResponse.sourceImageId) {
      // Try to fetch the original image
      const originalImage = await db.images.findUnique({
        where: { id: firstResponse.sourceImageId },
      });

      console.log(`Found original image:`, originalImage);
      if (originalImage) {
        chain.unshift({
          id: `source-${originalImage.id}`,
          type: "source",
          prompt: null,
          url: originalImage.url,
          previousResponseId: null,
          sourceImageId: null,
          sourceImage: {
            id: originalImage.id,
            url: originalImage.url,
            address: originalImage.address,
          },
        });
      }
    }
  }

  console.log(`Built chain for response ${responseId}:`, chain.length, "items");
  console.log(
    "Chain items:",
    chain.map((item) => ({
      id: item.id,
      type: item.type,
      prompt: item.prompt?.substring(0, 50),
    })),
  );

  return chain;
}

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
          deletedAt: null,
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

      // Build where clause to include:
      // 1. All public posts
      // 2. Private posts shared TO the current user by others
      // 3. Private posts shared BY the current user to others
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
                {
                  isPublic: false,
                  sharedById: currentUserId, // Posts shared BY the current user
                },
              ]
            : []),
        ],
      };

      const sharedChains = await ctx.db.sharedChain.findMany({
        where: {
          ...whereClause,
          response: {
            deletedAt: null, // Filter out shared chains with deleted responses
          },
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

      const itemsWithFullChain = await Promise.all(
        sharedChains.map(async (post) => {
          const responseChain = await getFullResponseChain(
            ctx.db,
            post.responseId,
          );
          console.log(
            `Response chain for post ${post.id}:`,
            responseChain.length,
            "items",
          );
          return {
            ...post,
            responseChain,
          };
        }),
      );

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
        where: {
          ...whereClause,
          response: {
            deletedAt: null, // Filter out shared chains with deleted responses
          },
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
        throw new Error("Shared post not found or access denied");
      }

      // Update view count
      await ctx.db.sharedChain.update({
        where: { id: input.id },
        data: { viewCount: { increment: 1 } },
      });

      const responseChain = await getFullResponseChain(
        ctx.db,
        sharedChain.responseId,
      );

      return {
        ...sharedChain,
        responseChain,
      };
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

  getUserLikedResponses: protectedProcedure.query(async ({ ctx }) => {
    const likes = await ctx.db.like.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        sharedChain: {
          where: {
            deletedAt: null, // Filter out deleted shared chains
            response: {
              deletedAt: null, // Filter out shared chains with deleted responses
            },
          },
        },
      },
    });

    const responses = likes
      .map((like) => like.sharedChain)
      .filter((chain) => chain !== null);

    return responses;
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
