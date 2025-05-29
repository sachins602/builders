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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.imageUrl) {
        throw new Error("No image provided");
      }

      // Get the full path to the image
      const imagePath = path.join(process.cwd(), "public", input.imageUrl);
      console.log("input image path", imagePath);

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

      return response.data[0]?.b64_json;
    }),
});
