import { z } from "zod";
import OpenAI, { toFile } from "openai";
import { env } from "~/env";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { StorageService } from "~/lib/storage";

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

      // Fetch the image from UploadThing URL
      const imageResponse = await fetch(input.imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }

      // Get the image as buffer and convert to File
      const arrayBuffer = await imageResponse.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);
      const imageFile = await toFile(imageBuffer, "image.jpg", {
        type: "image/jpeg",
      });

      // Use the images.generate API with the enhanced prompt
      const response = await openai.images.edit({
        model: "gpt-image-1",
        image: imageFile,
        prompt: input.prompt,
        n: 1,
        quality: "low",
      });
      if (!response.data) {
        throw new Error("No image generated");
      }

      // Check if b64_json exists before processing
      const imageData = response.data[0]?.b64_json;
      if (!imageData) {
        throw new Error("No image data received from OpenAI");
      }

      // Use StorageService to save the image (local or cloud based on environment)
      const imageName = String(Math.floor(Math.random() * 1000));
      const uploadResult = await StorageService.saveBase64Image(
        imageData,
        imageName,
      );

      if (!uploadResult.success) {
        throw new Error(`Failed to save image: ${uploadResult.error}`);
      }

      const imagePathDb = uploadResult.url;

      // Create response data based on whether this is a new generation or a follow-up
      const responseData = {
        prompt: input.prompt,
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
        throw new Error(
          "Either imageId or previousResponseId must be provided",
        );
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

      // Fetch the previous image from UploadThing URL
      const imageResponse = await fetch(previousResponse.url);
      if (!imageResponse.ok) {
        throw new Error(
          `Failed to fetch previous image: ${imageResponse.status}`,
        );
      }

      // Get the image as buffer and convert to File
      const arrayBuffer = await imageResponse.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);
      const imageFile = await toFile(imageBuffer, "image.jpg", {
        type: "image/jpeg",
      });

      // Use the images.generate API with the new prompt
      const response = await openai.images.edit({
        model: "gpt-image-1",
        image: imageFile,
        prompt: input.prompt,
        n: 1,
        quality: "low",
      });

      if (!response.data) {
        throw new Error("No image generated");
      }

      // Check if b64_json exists before processing
      const imageData = response.data[0]?.b64_json;
      if (!imageData) {
        throw new Error("No image data received from OpenAI");
      }

      // Use StorageService to save the image (local or cloud based on environment)
      const imageName = String(Math.floor(Math.random() * 1000));
      const uploadResult = await StorageService.saveBase64Image(
        imageData,
        imageName,
      );

      if (!uploadResult.success) {
        throw new Error(`Failed to save image: ${uploadResult.error}`);
      }

      // Save the path to the database
      const imagePathDb = uploadResult.url;

      // Create a new response that links to the previous one
      return ctx.db.response.create({
        data: {
          prompt: input.prompt,
          url: imagePathDb,
          createdBy: { connect: { id: ctx.session.user.id } },
          previousResponse: { connect: { id: input.previousResponseId } },
        },
      });
    }),
});
