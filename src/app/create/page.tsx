import { auth } from "~/server/auth";
import { ProompInput } from "../_components/input";
import { HydrateClient } from "~/trpc/server";

export default async function Create() {
  const session = await auth();
  if (!session?.user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-800 text-white">
        <div className="rounded-lg bg-gray-700 p-8 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold">
            Authentication Required
          </h2>
          <p>Please sign in to use the AI image generation feature.</p>
        </div>
      </div>
    );
  }

  return (
    <HydrateClient>
      <div className="container mx-auto py-8">
        <div className="mb-6 rounded-lg bg-gray-700 p-6 text-white shadow-lg">
          <h1 className="mb-4 text-2xl font-bold">AI Image Generator</h1>
          <p className="mb-6 text-gray-300">
            Generate AI images using OpenAI&apos;s GPT-image-1 model. You can
            use your street view images as reference or create entirely new
            images with detailed prompts.
          </p>
          <ProompInput />
        </div>
      </div>
    </HydrateClient>
  );
}
