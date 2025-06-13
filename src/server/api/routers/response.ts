import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
import { env } from "~/env";



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
  place_id?: string;
  types?: string[];
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
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Google API responded with ${response.status}` });
      }

      const imageBuffer = await response.arrayBuffer();

      if (!imageBuffer) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch image data" });
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
    .input(z.object({ address: z.string().optional(), lat: z.number().optional(), lng: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { lat, lng } = input;
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Latitude and longitude are required." });
      }
      const imageName = ctx.session.user.id + lat + lng;

      const addressResponse = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${env.NEXT_PUBLIC_GOOGLE_API_KEY}`);
      if (!addressResponse.ok) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Google API responded with ${addressResponse.status}` });
      }
      const addressData = await addressResponse.json() as GoogleGeocodingResponse;
      if (!addressData.results[0]?.formatted_address) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No address data received from Google" });
      }
      const formattedAddress = addressData.results[0].formatted_address;

      const response = await fetch(`https://maps.googleapis.com/maps/api/streetview?parameters&size=640x640&fov=50&location=${encodeURIComponent(formattedAddress)}&key=${env.NEXT_PUBLIC_GOOGLE_API_KEY}`);
      if (!response.ok) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Google API responded with ${response.status}` });
      }

      const imageBuffer = await response.arrayBuffer();
      if (!imageBuffer) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch image data" });
      }
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

  getPlacesDetails: publicProcedure
    .input(z.object({ address: z.string() }))
    .mutation(async ({ input }) => {


      const { address } = input;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        `${address}, Toronto`,
      )}&key=${env.NEXT_PUBLIC_GOOGLE_API_KEY}`;

      const response = await (await fetch(url)).json() as GoogleGeocodingResponse;
      if (response.status !== "OK") {
        if (response.error_message) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: response.error_message });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Geocoding API request failed." });
      }

      const result = response?.results[0];

      if (!result?.geometry?.location) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Could not find location for the given address." });
      }

      const formattedGeoCodeData = {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
      }

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
});
