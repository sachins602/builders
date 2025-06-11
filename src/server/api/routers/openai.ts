import { z } from "zod";
import OpenAI, { toFile } from "openai";
import { env } from "~/env";
import path from "path";
import fs from "fs";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export const openaiRouter = createTRPCRouter({
  generateImage: protectedProcedure
    .input(
      z.object({
        prompt: z.string().min(1),
        imageUrl: z.string().optional(),
        imageId: z.number().optional(),
        previousResponseId: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.imageUrl) {
        throw new Error("No image provided");
      }

      // Get the full path to the image
      const imagePath = path.join(process.cwd(), "public", input.imageUrl);

      // Check if the file exists
      if (!fs.existsSync(imagePath)) {
        throw new Error("Image file not found");
      }

      // Use the images.generate API with the enhanced prompt
      const response = await openai.images.edit({
        model: "gpt-image-1",
        image: await toFile(fs.createReadStream(imagePath), null, {
          type: "image/jpeg",
        }),
        prompt: input.prompt,
        n: 1,
        quality: "low",
      });
      if (!response.data) {
        throw new Error("No image generated");
      }

      // save the image to the local filesystem at /public/generatedimages and save the path to the database
      const imageName = String(Math.floor(Math.random() * 1000));
      const fileType = "jpg";
      // Ensure the directory exists
      const generatedImagesDir = path.join(process.cwd(), "public", "generatedimages");
      if (!fs.existsSync(generatedImagesDir)) {
        fs.mkdirSync(generatedImagesDir, { recursive: true });
      }
      const filePath = path.join(generatedImagesDir, `${imageName}.${fileType}`);

      // Check if b64_json exists before writing to file
      const imageData = response.data[0]?.b64_json;
      if (!imageData) {
        throw new Error("No image data received from OpenAI");
      }

      // Write the file using Buffer to properly handle base64 data
      fs.writeFileSync(filePath, Buffer.from(imageData, 'base64'));

      // save the path to the database
      const imagePathDb = `/generatedimages/${imageName}.${fileType}`;

      // Create response data based on whether this is a new generation or a follow-up
      const responseData = {
        proompt: input.prompt,
        url: imagePathDb,
        createdBy: { connect: { id: ctx.session.user.id } },
      };

      // If this is based on a previous response, create a chain
      if (input.previousResponseId) {
        return ctx.db.response.create({
          data: {
            ...responseData,
            previousResponse: { connect: { id: input.previousResponseId } },
          },
        });
      } 
      // If this is based on an original image, link to that image
      else if (input.imageId) {
        return ctx.db.response.create({
          data: {
            ...responseData,
            sourceImage: { connect: { id: input.imageId } },
          },
        });
      } else {
        throw new Error("Either imageId or previousResponseId must be provided");
      }
    }),

  // Add a new procedure for continuing from a previous response
  continueFromResponse: protectedProcedure
    .input(
      z.object({
        prompt: z.string().min(1),
        previousResponseId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // First, get the previous response to get its image URL
      const previousResponse = await ctx.db.response.findUnique({
        where: { id: input.previousResponseId },
      });

      if (!previousResponse) {
        throw new Error("Previous response not found");
      }

      // Get the full path to the previous image
      const imagePath = path.join(process.cwd(), "public", previousResponse.url);

      // Check if the file exists
      if (!fs.existsSync(imagePath)) {
        throw new Error("Previous image file not found");
      }

      // Use the images.generate API with the new prompt
      const response = await openai.images.edit({
        model: "gpt-image-1",
        image: await toFile(fs.createReadStream(imagePath), null, {
          type: "image/jpeg",
        }),
        prompt: input.prompt,
        n: 1,
        quality: "low",
      });

      if (!response.data) {
        throw new Error("No image generated");
      }

      // Save the new image
      const imageName = String(Math.floor(Math.random() * 1000));
      const fileType = "jpg";
      const generatedImagesDir = path.join(process.cwd(), "public", "generatedimages");
      if (!fs.existsSync(generatedImagesDir)) {
        fs.mkdirSync(generatedImagesDir, { recursive: true });
      }
      const filePath = path.join(generatedImagesDir, `${imageName}.${fileType}`);

      // Check if b64_json exists before writing to file
      const imageData = response.data[0]?.b64_json;
      if (!imageData) {
        throw new Error("No image data received from OpenAI");
      }

      // Write the file using Buffer to properly handle base64 data
      fs.writeFileSync(filePath, Buffer.from(imageData, 'base64'));

      // Save the path to the database
      const imagePathDb = `/generatedimages/${imageName}.${fileType}`;

      // Create a new response that links to the previous one
      return ctx.db.response.create({
        data: {
          proompt: input.prompt,
          url: imagePathDb,
          createdBy: { connect: { id: ctx.session.user.id } },
          previousResponse: { connect: { id: input.previousResponseId } },
        },
      });
    }),
});
