import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";
import { ChatInterface } from "../_components/ChatInterface";

export default async function Create() {
  const session = await auth();
  if (!session?.user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="rounded-lg border bg-white p-8 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            Authentication Required
          </h2>
          <p className="text-gray-600">
            Please sign in to use the AI image generation feature.
          </p>
        </div>
      </div>
    );
  }

  return (
    <HydrateClient>
      <main className="flex h-screen w-full flex-col">
        <ChatInterface />
      </main>
    </HydrateClient>
  );
}
