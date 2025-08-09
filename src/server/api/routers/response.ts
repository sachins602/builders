import { z } from "zod";
import { env } from "~/env";
import { getPropertyBoundary } from "~/lib/propertyBoundaryService";
import { StorageService } from "~/lib/storage";

import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type {
  Image as ImageModel,
  Response as ResponseModel,
} from "@prisma/client";

interface GoogleGeocodingResponse {
  results: GeoCodeResponse[];
  status: string;
  error_message?: string;
}

interface GeoCodeResponse {
  address_components?: AddressComponent[];
  formatted_address?: string;
  geometry?: Geometry;
  navigation_points?: NavigationPoint[];
  place_id?: string;
  types?: string[];
}

interface NavigationPoint {
  location?: Location[];
}

interface AddressComponent {
  long_name?: string;
  short_name?: string;
  types?: string[];
}

interface Geometry {
  bounds?: Bounds;
  location?: Location;
  location_type?: string;
  viewport?: Bounds;
}

interface Bounds {
  northeast?: Location;
  southwest?: Location;
}

interface Location {
  lat?: number;
  lng?: number;
}

export const responseRouter = createTRPCRouter({
  saveStreetViewImage: protectedProcedure
    .input(
      z.object({
        address: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { lat, lng } = input;
      if (typeof lat !== "number" || typeof lng !== "number") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Latitude and longitude are required.",
        });
      }
      const imageName = ctx.session.user.id + lat + lng;

      const boundaryResult = await getPropertyBoundary(lat, lng);

      if (!boundaryResult.ok) {
        const code =
          boundaryResult.code === "NO_BUILDINGS_FOUND" ||
          boundaryResult.code === "NO_GEOMETRY_ON_CLOSEST_BUILDING"
            ? "NOT_FOUND"
            : "INTERNAL_SERVER_ERROR";
        throw new TRPCError({
          code,
          message: boundaryResult.message,
        });
      }

      const propertyBoundary = boundaryResult.boundary;

      if (propertyBoundary.properties.propertyType !== "residential") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only residential buildings are supported.",
        });
      }

      if (propertyBoundary.properties.buildingType === "apartments") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Apartments are not supported.",
        });
      }

      // Get address information from Google (for street view image)
      const addressResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${env.GOOGLE_API_KEY}`,
      );
      if (!addressResponse.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Google API responded with ${addressResponse.status}`,
        });
      }
      const addressData =
        (await addressResponse.json()) as GoogleGeocodingResponse;
      if (!addressData.results[0]?.formatted_address) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No address data received from Google",
        });
      }
      const formattedAddress = addressData.results[0].formatted_address;

      // Get street view image
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/streetview?parameters&size=640x640&fov=50&location=${encodeURIComponent(
          formattedAddress,
        )}&key=${env.GOOGLE_API_KEY}`,
      );
      if (!response.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Google API responded with ${response.status}`,
        });
      }

      const imageBuffer = await response.arrayBuffer();
      if (!imageBuffer) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch image data",
        });
      }

      // Use StorageService to save the image
      const uploadResult = await StorageService.saveBufferImage(
        imageBuffer,
        imageName,
      );

      if (!uploadResult.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to save image: ${uploadResult.error}`,
        });
      }

      // Create enhanced image record with property boundary data
      const image = await ctx.db.image.create({
        data: {
          address: propertyBoundary.properties.address ?? formattedAddress,
          lat,
          lng,
          name: imageName,
          url: uploadResult.url,

          // OSM building data
          osmBuildingId: propertyBoundary.properties.osmId,
          propertyBoundary: JSON.stringify(propertyBoundary.geometry),
          propertyType: propertyBoundary.properties.propertyType,
          buildingType: propertyBoundary.properties.buildingType,
          buildingArea: propertyBoundary.properties.buildingArea,

          createdBy: { connect: { id: ctx.session.user.id } },
        },
      });

      return image;
    }),

  getImages: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.image.findMany({
      select: {
        id: true,
        name: true,
        url: true,
        lat: true,
        lng: true,
      },
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" }, // Optional: order by creation date
    });
  }),

  getImageById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const image = await ctx.db.image.findFirst({
        where: { id: input.id, deletedAt: null },
        select: {
          id: true,
          name: true,
          url: true,
          address: true,
          lat: true,
          lng: true,
          propertyType: true,
          buildingType: true,
          buildingArea: true,
          createdAt: true,
        },
      });
      return image;
    }),

  // New combined endpoint for better performance
  getChatData: protectedProcedure.query(async ({ ctx }) => {
    const [lastImage, responses] = await Promise.all([
      ctx.db.image.findFirst({
        orderBy: { createdAt: "desc" },
        where: { createdById: ctx.session.user.id, deletedAt: null },
      }),
      ctx.db.response.findMany({
        where: { createdById: ctx.session.user.id, deletedAt: null },
        orderBy: [{ createdAt: "desc" }],
        include: { chain: { include: { rootImage: true } } },
      }),
    ]);

    // Compute previousResponseId per chain using step ordering for client compatibility
    type ResponseWithChain = ResponseModel & {
      chain: { rootImage: ImageModel | null };
    };
    const responsesByChain = new Map<string, ResponseWithChain[]>();
    for (const r of responses as ResponseWithChain[]) {
      const list =
        responsesByChain.get(r.chainId) ?? ([] as ResponseWithChain[]);
      list.push(r);
      responsesByChain.set(r.chainId, list);
    }

    const responseHistory = (responses as ResponseWithChain[]).map((r) => {
      const chainResponses =
        responsesByChain.get(r.chainId) ?? ([] as ResponseWithChain[]);
      const prev = chainResponses.find((cr) => cr.step === r.step - 1) ?? null;
      const root = r.chain.rootImage ?? null;
      return {
        id: r.id,
        prompt: r.prompt,
        url: r.url,
        createdAt: r.createdAt,
        // Derived fields for backward compatibility with client types
        previousResponseId: prev ? prev.id : null,
        sourceImageId: root ? root.id : null,
        sourceImage: root,
      } as const;
    });

    return { lastImage: lastImage ?? null, responseHistory };
  }),

  getResponsesByUserId: protectedProcedure.query(async ({ ctx }) => {
    // Return only first-step responses per chain for a concise history
    const responses = await ctx.db.response.findMany({
      where: { createdById: ctx.session.user.id, deletedAt: null, step: 1 },
      include: { chain: { include: { rootImage: true } } },
      orderBy: { createdAt: "desc" },
    });

    return (
      responses as Array<
        ResponseModel & { chain: { rootImage: ImageModel | null } }
      >
    ).map((r) => ({
      id: r.id,
      prompt: r.prompt,
      url: r.url,
      createdAt: r.createdAt,
      previousResponseId: null,
      sourceImageId: r.chain.rootImage ? r.chain.rootImage.id : null,
      sourceImage: r.chain.rootImage ?? null,
    }));
  }),

  getResponseById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const response = await ctx.db.response.findFirst({
        where: { id: input.id, deletedAt: null },
      });
      return response;
    }),

  getResponseChainsByImageId: protectedProcedure
    .input(z.object({ imageId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Fetch all chains for this image with their responses in step order
      const chains = await ctx.db.chain.findMany({
        where: { rootImageId: input.imageId, deletedAt: null },
        include: {
          responses: { where: { deletedAt: null }, orderBy: { step: "asc" } },
        },
        orderBy: { createdAt: "asc" },
      });

      // Map to the legacy shape expected by the client (with derived previousResponseId)
      return chains.map((c) =>
        c.responses.map((r, idx) => ({
          id: r.id,
          prompt: r.prompt,
          url: r.url,
          createdAt: r.createdAt,
          previousResponseId: idx > 0 ? c.responses[idx - 1]!.id : null,
          // Provide source image id for type compatibility and client convenience
          sourceImageId: input.imageId,
        })),
      );
    }),

  getEnhancedParcelData: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const parcels = await ctx.db.image.findMany({
      select: {
        id: true,
        address: true,
        lat: true,
        lng: true,
        url: true,
        propertyBoundary: true,
        propertyType: true,
        buildingType: true,
        buildingArea: true,
        chains: {
          select: {
            id: true,
            responses: {
              where: { deletedAt: null },
              select: { id: true, createdById: true },
            },
            shares: {
              where: { deletedAt: null },
              select: {
                id: true,
                visibility: true,
                recipients: { select: { userId: true } },
              },
            },
          },
        },
      },
      where: {
        deletedAt: null,
        OR: [
          // Images created by user with any responses (owned data)
          { createdById: userId },
          // Images that have at least one response by the user
          {
            chains: { some: { responses: { some: { createdById: userId } } } },
          },
          // Images that are shared to the user or public via their chains
          {
            chains: {
              some: {
                shares: {
                  some: {
                    deletedAt: null,
                    OR: [
                      { visibility: "PUBLIC" },
                      { recipients: { some: { userId } } },
                    ],
                  },
                },
              },
            },
          },
        ],
      },
    });

    // Parse boundary, and strip internal relations
    return parcels.map((p) => ({
      id: p.id,
      address: p.address,
      lat: p.lat,
      lng: p.lng,
      url: p.url,
      imageUrl: p.url,
      propertyType: p.propertyType,
      buildingType: p.buildingType,
      buildingArea: p.buildingArea,
      propertyBoundary:
        p.propertyBoundary == null
          ? null
          : typeof p.propertyBoundary === "string"
            ? (JSON.parse(p.propertyBoundary) as GeoJSON.Polygon)
            : (p.propertyBoundary as unknown as GeoJSON.Polygon),
    }));
  }),

  deleteResponse: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      return ctx.db.response.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    }),

  getSharedStatusWithId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      // Find the response to get its chain, then check if that chain has a Share
      const response = await ctx.db.response.findFirst({
        where: { id: input.id, deletedAt: null },
      });
      if (!response) return null;
      return await ctx.db.share.findFirst({
        where: { chainId: response.chainId, deletedAt: null },
      });
    }),

  // Simplified endpoints for remix flow
  createNewChainFromImage: protectedProcedure
    .input(
      z.object({
        imageId: z.number(),
        prompt: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the image exists and user has access
      const image = await ctx.db.image.findFirst({
        where: { id: input.imageId, deletedAt: null },
      });

      if (!image) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Image not found",
        });
      }

      // Create a new chain rooted at this image
      const chain = await ctx.db.chain.create({
        data: {
          rootImageId: input.imageId,
          createdById: ctx.session.user.id,
        },
      });

      // Create first response in the chain (step = 1)
      return ctx.db.response.create({
        data: {
          prompt: input.prompt,
          url: "", // Will be updated after image generation
          chainId: chain.id,
          step: 1,
          createdById: ctx.session.user.id,
        },
      });
    }),

  continueChainFromResponse: protectedProcedure
    .input(
      z.object({
        responseId: z.number(),
        prompt: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the response exists and user has access
      const previousResponse = await ctx.db.response.findFirst({
        where: { id: input.responseId, deletedAt: null },
      });

      if (!previousResponse) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Previous response not found",
        });
      }

      // Compute next step within the same chain
      const last = await ctx.db.response.findFirst({
        where: { chainId: previousResponse.chainId, deletedAt: null },
        orderBy: { step: "desc" },
      });
      const nextStep = (last?.step ?? 0) + 1;

      // Create response linked to the same chain (continue chain)
      return ctx.db.response.create({
        data: {
          prompt: input.prompt,
          url: "", // Will be updated after image generation
          chainId: previousResponse.chainId,
          step: nextStep,
          createdById: ctx.session.user.id,
        },
      });
    }),
});
