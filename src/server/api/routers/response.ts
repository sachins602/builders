import fs from "fs";
import path, { resolve } from "path";
import { z } from "zod";
import { env } from "~/env";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

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
          name: imageName,
          url: `streetviewimages/${imageName}.${fileType}`,
          createdBy: { connect: { id: ctx.session.user.id } },
        },
      });

      return image;
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

  getLatest: protectedProcedure.query(async ({ ctx }) => {
    const post = await ctx.db.post.findFirst({
      orderBy: { createdAt: "desc" },
      where: { createdBy: { id: ctx.session.user.id } },
    });

    return post ?? null;
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
