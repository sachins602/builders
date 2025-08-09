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
      const response = await ctx.db.response.findFirst({
        where: {
          id: input.responseId,
          createdById: ctx.session.user.id,
          deletedAt: null,
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
      const response = await ctx.db.response.findFirst({
        where: {
          id: input.responseId,
          createdById: ctx.session.user.id,
          deletedAt: null,
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
