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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.imageUrl) {
        throw new Error("No image provided");
      }

      if (!input.imageId) {
        throw new Error("image id not found");
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

      return ctx.db.response.create({
        data: {
          createdByImageId: input.imageId.toString(),
          proompt: input.prompt,
          url: imagePathDb,
          createdBy: { connect: { id: ctx.session.user.id } },
        },
      });
    }),
});
