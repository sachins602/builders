// import { promises as fs } from "fs";
// import path from "path";
import { z } from "zod";
import { env } from "~/env";
import { getPropertyBoundary } from "~/lib/propertyBoundaryService";
import { StorageService } from "~/lib/storage";

import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

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
    .input(z.object({ lat: z.number(), lng: z.number(), heading: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { lat, lng, heading } = input;
      const imageName = String(lat + lng);

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${lat},${lng}&heading=${heading}&pitch=-0.76&key=${env.GOOGLE_API_KEY}`,
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

      // write the file path to the database and return the file path
      const image = await ctx.db.images.create({
        data: {
          lat: lat,
          lng: lng,
          name: imageName,
          url: uploadResult.url,
          createdBy: { connect: { id: ctx.session.user.id } },
        },
      });

      return image;
    }),

  saveStreetViewImageAddress: protectedProcedure
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

      const propertyBoundary = await getPropertyBoundary(lat, lng);

      if (!propertyBoundary) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No property boundary found at this location.",
        });
      }

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

      console.log(
        `Using OSM boundary data for building: ${propertyBoundary.properties.buildingType}`,
      );

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
      const image = await ctx.db.images.create({
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
    return ctx.db.images.findMany({
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

  getLastImage: protectedProcedure.query(async ({ ctx }) => {
    const image = await ctx.db.images.findFirst({
      orderBy: { createdAt: "desc" },
      where: { createdBy: { id: ctx.session.user.id }, deletedAt: null },
    });
    return image ?? null;
  }),

  getResponseHistory: protectedProcedure.query(async ({ ctx }) => {
    const responses = await ctx.db.response.findMany({
      orderBy: { createdAt: "desc" },
      where: { createdBy: { id: ctx.session.user.id }, deletedAt: null },
    });
    return responses;
  }),

  // New combined endpoint for better performance
  getChatData: protectedProcedure.query(async ({ ctx }) => {
    const [lastImage, responseHistory] = await Promise.all([
      ctx.db.images.findFirst({
        orderBy: { createdAt: "desc" },
        where: { createdBy: { id: ctx.session.user.id }, deletedAt: null },
      }),
      ctx.db.response.findMany({
        orderBy: { createdAt: "desc" },
        where: { createdBy: { id: ctx.session.user.id }, deletedAt: null },
        include: {
          sourceImage: true, // Include the original image data
        },
      }),
    ]);

    return {
      lastImage: lastImage ?? null,
      responseHistory,
    };
  }),

  getResponsesByUserId: protectedProcedure.query(async ({ ctx }) => {
    const responses = await ctx.db.response.findMany({
      where: {
        createdBy: { id: ctx.session.user.id },
        deletedAt: null,
        previousResponseId: null,
      },
      include: { sourceImage: true },
      orderBy: { createdAt: "desc" },
    });
    return responses;
  }),

  getResponseById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const response = await ctx.db.response.findUnique({
        where: { id: input.id, deletedAt: null },
      });
      return response;
    }),

  getResponseByImageId: protectedProcedure
    .input(z.object({ imageId: z.number() }))
    .query(async ({ ctx, input }) => {
      const response = await ctx.db.response.findFirst({
        where: { sourceImageId: input.imageId, deletedAt: null },
      });
      return response;
    }),

  getPlacesDetails: publicProcedure
    .input(z.object({ address: z.string() }))
    .mutation(async ({ input }) => {
      const { address } = input;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        `${address}, Toronto`,
      )}&key=${env.GOOGLE_API_KEY}`;

      const response = (await (
        await fetch(url)
      ).json()) as GoogleGeocodingResponse;
      if (response.status !== "OK") {
        if (response.error_message) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: response.error_message,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Geocoding API request failed.",
        });
      }

      const result = response?.results[0];

      if (!result?.geometry?.location) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Could not find location for the given address.",
        });
      }

      const formattedGeoCodeData = {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
      };

      return formattedGeoCodeData;
    }),

  getNearbyImages: protectedProcedure
    .input(z.object({ lat: z.number(), lng: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { lat, lng } = input;
      const nearbyImages = await ctx.db.images.findMany({
        where: {
          lat: {
            gte: lat - 0.01,
            lte: lat + 0.01,
          },
          lng: {
            gte: lng - 0.01,
            lte: lng + 0.01,
          },
        },
        take: 4,
      });
      return nearbyImages;
    }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),

  getEnhancedParcelData: protectedProcedure.query(async ({ ctx }) => {
    const parcels = await ctx.db.images.findMany({
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
      },
      where: {
        deletedAt: null,
        OR: [
          {
            createdBy: { id: ctx.session.user.id },
            responses: { some: { createdBy: { id: ctx.session.user.id } } },
          },
          // Images with responses that are shared to the user
          {
            responses: {
              some: {
                sharedChains: {
                  some: {
                    deletedAt: null,
                    OR: [
                      { isPublic: true },
                      {
                        sharedToUsers: {
                          some: { userId: ctx.session.user.id },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        ],
      },
    });

    // Parse the JSON boundary data for frontend use
    return parcels.map((parcel) => ({
      ...parcel,
      imageUrl: parcel.url,
      propertyBoundary: parcel.propertyBoundary
        ? (JSON.parse(parcel.propertyBoundary as string) as GeoJSON.Polygon)
        : null,
    }));
  }),

  createResponse: protectedProcedure
    .input(
      z.object({
        prompt: z.string(),
        url: z.string(),
        sourceImageId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prompt, url, sourceImageId } = input;
      return ctx.db.response.create({
        data: {
          prompt,
          url,
          sourceImageId,
          createdById: ctx.session.user.id,
        },
      });
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
      const { id } = input;
      return await ctx.db.sharedChain.findFirst({
        where: { responseId: id, deletedAt: null },
      });
    }),
});
