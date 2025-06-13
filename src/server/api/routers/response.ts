import fs from "fs";
import path, { resolve } from "path";
import { z } from "zod";
import { env } from "~/env";



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
        // "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTc9APxkj0xClmrU3PpMZglHQkx446nQPG6lA&s",
      );
      if (!response.ok) {
        return new Error(`Google API responded with ${response.status}`);
      }

      // Get the image data as an array buffer
      const imageBuffer = await response.arrayBuffer();

      if (!imageBuffer) {
        return new Error("Failed to fetch image data");
      }

      const arrayBuffer = new Uint8Array(imageBuffer);

      // save the image to the local filesystem at /public/streetviewimages and save the path to the database
      const fileType = "jpg";
      // Ensure the directory exists
      const dir = path.dirname(`./public/streetviewimages`);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const filePath = `./public/streetviewimages/${imageName}.${fileType}`;

      // Write the file
      fs.writeFile(filePath, arrayBuffer, (err) => {
        if (err) {
          console.error("Error writing file:", err);
        } else {
          resolve();
        }
      });

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
      const { address, lat, lng } = input;
      const imageName = ctx.session.user.id + lat + lng;


      const addressResponse = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${env.NEXT_PUBLIC_GOOGLE_API_KEY}`);
      if (!addressResponse.ok) {
        return new Error(`Google API responded with ${addressResponse.status}`);
      }
      const addressData = await addressResponse.json() as GoogleGeocodingResponse;
      if (!addressData.results[0]) {
        return new Error("No address data received from Google");
      }
      const formattedAddress = addressData.results[0].formatted_address;


      const response = await fetch(`https://maps.googleapis.com/maps/api/streetview?parameters&size=640x640&fov=50&location=${formattedAddress}&key=${env.NEXT_PUBLIC_GOOGLE_API_KEY}`)
      if (!response.ok) {
        return new Error(`Google API responded with ${response.status}`);
      }

      // Get the image data as an array buffer
      const imageBuffer = await response.arrayBuffer();

      if (!imageBuffer) {
        return new Error("Failed to fetch image data");
      }

      const arrayBuffer = new Uint8Array(imageBuffer);

      // save the image to the local filesystem at /public/streetviewimages and save the path to the database
      const fileType = "jpg";
      // Ensure the directory exists
      const dir = path.dirname(`./public/streetviewimages`);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const filePath = `./public/streetviewimages/${imageName}.${fileType}`;

      // Write the file
      fs.writeFile(filePath, arrayBuffer, (err) => {
        if (err) {
          console.error("Error writing file:", err);
        } else {
          resolve();
        }
      });

      // write the file path to the database and return the file path
      const image = await ctx.db.images.create({
        data: {
          address: address,
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
        throw new Error(response.error_message);
      }




      const formattedGeoCodeData = {
        lat: response?.results[0]?.geometry?.location?.lat,
        lng: response?.results[0]?.geometry?.location?.lng,
        formattedAddress: response?.results[0]?.formatted_address,
      }

      return formattedGeoCodeData;

    }),


  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
