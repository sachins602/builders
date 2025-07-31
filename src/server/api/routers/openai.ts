import { z } from "zod";
import OpenAI, { toFile } from "openai";
import { TRPCError } from "@trpc/server";
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
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No image provided",
        });
      }

      // Fetch the image from UploadThing URL
      const imageResponse = await fetch(input.imageUrl);
      if (!imageResponse.ok) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Failed to fetch image: ${imageResponse.status}`,
        });
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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No image generated",
        });
      }

      // Check if b64_json exists before processing
      const imageData = response.data[0]?.b64_json;
      if (!imageData) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No image data received from OpenAI",
        });
      }

      // Use StorageService to save the image (local or cloud based on environment)
      const imageName = String(Math.floor(Math.random() * 1000));
      const uploadResult = await StorageService.saveBase64Image(
        imageData,
        imageName,
      );

      if (!uploadResult.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to save image: ${uploadResult.error}`,
        });
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
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Either imageId or previousResponseId must be provided",
        });
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
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Previous response not found",
        });
      }

      // Fetch the previous image from UploadThing URL
      const imageResponse = await fetch(previousResponse.url);
      if (!imageResponse.ok) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Failed to fetch previous image: ${imageResponse.status}`,
        });
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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No image generated",
        });
      }

      // Check if b64_json exists before processing
      const imageData = response.data[0]?.b64_json;
      if (!imageData) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No image data received from OpenAI",
        });
      }

      // Use StorageService to save the image (local or cloud based on environment)
      const imageName = String(Math.floor(Math.random() * 1000));
      const uploadResult = await StorageService.saveBase64Image(
        imageData,
        imageName,
      );

      if (!uploadResult.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to save image: ${uploadResult.error}`,
        });
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

  // Simplified endpoints for remix flow
  generateFromImage: protectedProcedure
    .input(
      z.object({
        responseId: z.number(), // The response record that was pre-created
        imageUrl: z.string(), // The source image URL
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get the response record to get the prompt
      const response = await ctx.db.response.findUnique({
        where: {
          id: input.responseId,
          createdById: ctx.session.user.id,
        },
      });

      if (!response) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Response not found",
        });
      }

      // Fetch the image from URL
      const imageResponse = await fetch(input.imageUrl);
      if (!imageResponse.ok) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Failed to fetch image: ${imageResponse.status}`,
        });
      }

      // Get the image as buffer and convert to File
      const arrayBuffer = await imageResponse.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);
      const imageFile = await toFile(imageBuffer, "image.jpg", {
        type: "image/jpeg",
      });

      // Generate with OpenAI
      const openaiResponse = await openai.images.edit({
        model: "gpt-image-1",
        image: imageFile,
        prompt: response.prompt,
        n: 1,
        quality: "low",
      });

      if (!openaiResponse.data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No image generated",
        });
      }

      const imageData = openaiResponse.data[0]?.b64_json;
      if (!imageData) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No image data received from OpenAI",
        });
      }

      // Save the generated image
      const imageName = String(Math.floor(Math.random() * 1000));
      const uploadResult = await StorageService.saveBase64Image(
        imageData,
        imageName,
      );

      if (!uploadResult.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to save image: ${uploadResult.error}`,
        });
      }

      // Update the response with the generated image URL
      return ctx.db.response.update({
        where: { id: input.responseId },
        data: { url: uploadResult.url },
      });
    }),

  generateFromResponse: protectedProcedure
    .input(
      z.object({
        responseId: z.number(), // The new response record that was pre-created
        previousImageUrl: z.string(), // The URL of the previous response's image
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get the response record to get the prompt
      const response = await ctx.db.response.findUnique({
        where: {
          id: input.responseId,
          createdById: ctx.session.user.id,
        },
      });

      if (!response) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Response not found",
        });
      }

      // Fetch the previous image
      const imageResponse = await fetch(input.previousImageUrl);
      if (!imageResponse.ok) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Failed to fetch image: ${imageResponse.status}`,
        });
      }

      // Get the image as buffer and convert to File
      const arrayBuffer = await imageResponse.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);
      const imageFile = await toFile(imageBuffer, "image.jpg", {
        type: "image/jpeg",
      });

      // Generate with OpenAI
      const openaiResponse = await openai.images.edit({
        model: "gpt-image-1",
        image: imageFile,
        prompt: response.prompt,
        n: 1,
        quality: "low",
      });

      if (!openaiResponse.data) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No image generated",
        });
      }

      const imageData = openaiResponse.data[0]?.b64_json;
      if (!imageData) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No image data received from OpenAI",
        });
      }

      // Save the generated image
      const imageName = String(Math.floor(Math.random() * 1000));
      const uploadResult = await StorageService.saveBase64Image(
        imageData,
        imageName,
      );

      if (!uploadResult.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to save image: ${uploadResult.error}`,
        });
      }

      // Update the response with the generated image URL
      return ctx.db.response.update({
        where: { id: input.responseId },
        data: { url: uploadResult.url },
      });
    }),
});
