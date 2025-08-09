import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { HydrateClient } from "~/trpc/server";
import { ChatInterface } from "../../_components/ChatInterface";

interface PageProps {
  params: Promise<{
    responseId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  const session = await auth();
  if (!session?.user) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-lg border bg-white p-8 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            Authentication Required
          </h2>
          <p className="text-gray-600">
            Please sign in to continue with image generation.
          </p>
        </div>
      </div>
    );
  }

  const responseId = parseInt(resolvedParams.responseId);
  if (isNaN(responseId)) {
    return <div>The Response you are looking for is not available</div>;
  }

  // Fetch the response to ensure it exists and belongs to the user
  const response = await api.response.getResponseById({ id: responseId });
  if (!response || response.createdById !== session.user.id) {
    return <div>The Response you are looking for is not available</div>;
  }

  return (
    <HydrateClient>
      <ChatInterface
        continueFromResponse={{
          id: response.id,
          prompt: response.prompt,
          url: response.url,
          // We can derive the source image on the client via getChatData; not needed here
          sourceImageId: null,
        }}
      />
    </HydrateClient>
  );
}
