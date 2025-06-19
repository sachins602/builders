import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
import { env } from "~/env";
import { getPropertyBoundary } from "~/lib/propertyBoundaryService";

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
        `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${lat},${lng}&heading=${heading}&pitch=-0.76&key=${env.NEXT_PUBLIC_GOOGLE_API_KEY}`,
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

      const arrayBuffer = new Uint8Array(imageBuffer);

      const fileType = "jpg";
      const dir = path.resolve(`./public/streetviewimages`);
      await fs.mkdir(dir, { recursive: true });
      const filePath = path.join(dir, `${imageName}.${fileType}`);

      await fs.writeFile(filePath, arrayBuffer);

      // write the file path to the database and return the file path
      const image = await ctx.db.images.create({
        data: {
          lat: lat,
          lng: lng,
          name: imageName,
          url: `streetviewimages/${imageName}.${fileType}`,
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

      try {
        // Get enhanced property boundary data
        const propertyBoundary = await getPropertyBoundary(lat, lng);
        console.log(
          `Using ${propertyBoundary.source} boundary data with ${propertyBoundary.accuracy} accuracy`,
        );

        // Get address information from Google (for street view image)
        const addressResponse = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${env.NEXT_PUBLIC_GOOGLE_API_KEY}`,
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

        // Legacy parcel data for backward compatibility
        const legacyParcelData = {
          location: addressData.results[0].geometry?.location ?? null,
          viewport: addressData.results[0].geometry?.viewport ?? null,
        };

        // Get street view image
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/streetview?parameters&size=640x640&fov=50&location=${encodeURIComponent(formattedAddress)}&key=${env.NEXT_PUBLIC_GOOGLE_API_KEY}`,
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
        const arrayBuffer = new Uint8Array(imageBuffer);

        const fileType = "jpg";
        const dir = path.resolve(process.cwd(), `public/streetviewimages`);
        await fs.mkdir(dir, { recursive: true });
        const filePath = path.join(dir, `${imageName}.${fileType}`);

        await fs.writeFile(filePath, arrayBuffer);

        // Calculate area of the property boundary
        const buildingArea = propertyBoundary.properties.buildingArea;

        // Create enhanced image record with property boundary data
        const image = await ctx.db.images.create({
          data: {
            address: propertyBoundary.properties.address ?? formattedAddress,
            lat,
            lng,
            name: imageName,
            url: `streetviewimages/${imageName}.${fileType}`,

            // Legacy parcel data for backward compatibility
            parcelData: JSON.stringify(legacyParcelData),

            // Enhanced property boundary data
            osmBuildingId: propertyBoundary.properties.osmId,
            osmBuildingGeometry: JSON.stringify(propertyBoundary.geometry),
            propertyBoundary: JSON.stringify(propertyBoundary.geometry),
            boundarySource: propertyBoundary.source,
            boundaryAccuracy: propertyBoundary.accuracy,

            // Property details
            propertyType: propertyBoundary.properties.propertyType,
            buildingType: propertyBoundary.properties.buildingType,
            buildingArea: buildingArea,
            lotArea: propertyBoundary.properties.lotArea,

            createdBy: { connect: { id: ctx.session.user.id } },
          },
        });

        return image;
      } catch (error) {
        console.error("Error in saveStreetViewImageAddress:", error);
        // Fallback to original functionality if enhanced boundary fails
        const addressResponse = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${env.NEXT_PUBLIC_GOOGLE_API_KEY}`,
        );
        const addressData =
          (await addressResponse.json()) as GoogleGeocodingResponse;
        const formattedAddress =
          addressData.results[0]?.formatted_address ?? "Unknown Address";

        const response = await fetch(
          `https://maps.googleapis.com/maps/api/streetview?parameters&size=640x640&fov=50&location=${encodeURIComponent(formattedAddress)}&key=${env.NEXT_PUBLIC_GOOGLE_API_KEY}`,
        );
        const imageBuffer = await response.arrayBuffer();
        const arrayBuffer = new Uint8Array(imageBuffer);

        const fileType = "jpg";
        const dir = path.resolve(process.cwd(), `public/streetviewimages`);
        await fs.mkdir(dir, { recursive: true });
        const filePath = path.join(dir, `${imageName}.${fileType}`);
        await fs.writeFile(filePath, arrayBuffer);

        const image = await ctx.db.images.create({
          data: {
            address: formattedAddress,
            lat,
            lng,
            name: imageName,
            url: `streetviewimages/${imageName}.${fileType}`,
            boundarySource: "fallback",
            boundaryAccuracy: "low",
            createdBy: { connect: { id: ctx.session.user.id } },
          },
        });

        return image;
      }
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
      orderBy: { createdAt: "desc" }, // Optional: order by creation date
    });
  }),

  getLastImage: protectedProcedure.query(async ({ ctx }) => {
    const image = await ctx.db.images.findFirst({
      orderBy: { createdAt: "desc" },
      where: { createdBy: { id: ctx.session.user.id } },
    });
    return image ?? null;
  }),

  getResponseHistory: protectedProcedure.query(async ({ ctx }) => {
    const responses = await ctx.db.response.findMany({
      orderBy: { createdAt: "desc" },
      where: { createdBy: { id: ctx.session.user.id } },
    });
    return responses;
  }),

  // New combined endpoint for better performance
  getChatData: protectedProcedure.query(async ({ ctx }) => {
    const [lastImage, responseHistory] = await Promise.all([
      ctx.db.images.findFirst({
        orderBy: { createdAt: "desc" },
        where: { createdBy: { id: ctx.session.user.id } },
      }),
      ctx.db.response.findMany({
        orderBy: { createdAt: "desc" },
        where: { createdBy: { id: ctx.session.user.id } },
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

  getResponseById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const response = await ctx.db.response.findUnique({
        where: { id: input.id },
      });
      return response;
    }),

  getResponseByImageId: protectedProcedure
    .input(z.object({ imageId: z.number() }))
    .query(async ({ ctx, input }) => {
      const response = await ctx.db.response.findFirst({
        where: { sourceImageId: input.imageId },
      });
      return response;
    }),

  getPlacesDetails: publicProcedure
    .input(z.object({ address: z.string() }))
    .mutation(async ({ input }) => {
      const { address } = input;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        `${address}, Toronto`,
      )}&key=${env.NEXT_PUBLIC_GOOGLE_API_KEY}`;

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
      const images = await ctx.db.images.findMany({
        where: {
          lat: {
            gte: lat - 0.1,
            lte: lat + 0.1,
          },
          lng: {
            gte: lng - 0.1,
            lte: lng + 0.1,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 4,
      });
      return images;
    }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),

  getParcelData: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.images.findMany({
      where: {
        OR: [
          {
            parcelData: {
              not: {
                equals: null,
              },
            },
          },
          {
            propertyBoundary: {
              not: {
                equals: null,
              },
            },
          },
        ],
      },
      select: {
        id: true,
        lat: true,
        lng: true,
        address: true,
        propertyBoundary: true,
        osmBuildingGeometry: true,
        boundarySource: true,
        boundaryAccuracy: true,
        propertyType: true,
        buildingType: true,
        buildingArea: true,
        lotArea: true,
        // Legacy support
        parcelData: true,
      },
    });
  }),

  getEnhancedParcelData: protectedProcedure.query(async ({ ctx }) => {
    const parcels = await ctx.db.images.findMany({
      where: {
        propertyBoundary: {
          not: {
            equals: null,
          },
        },
      },
      select: {
        id: true,
        lat: true,
        lng: true,
        address: true,
        propertyBoundary: true,
        osmBuildingGeometry: true,
        boundarySource: true,
        boundaryAccuracy: true,
        propertyType: true,
        buildingType: true,
        buildingArea: true,
        lotArea: true,
        osmBuildingId: true,
      },
    });

    // Parse the JSON boundary data for frontend use
    return parcels.map((parcel) => ({
      ...parcel,
      propertyBoundary: parcel.propertyBoundary
        ? (JSON.parse(parcel.propertyBoundary as string) as GeoJSON.Polygon)
        : null,
      osmBuildingGeometry: parcel.osmBuildingGeometry
        ? (JSON.parse(parcel.osmBuildingGeometry as string) as GeoJSON.Polygon)
        : null,
    }));
  }),
});
