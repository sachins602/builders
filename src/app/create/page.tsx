import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";
import { ChatInterface } from "../_components/ChatInterface";

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
      <div className="flex flex-col bg-gray-900 text-white">
        {/* Main content with sidebar */}
        <main className="flex flex-1">
          {/* Chat interface with sidebar */}
          <ChatInterface />
        </main>
      </div>
    </HydrateClient>
  );
}
