import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { notFound } from "next/navigation";
import { HydrateClient } from "~/trpc/server";
import { ChatInterface } from "../../_components/ChatInterface";

interface CreateWithResponsePageProps {
  params: {
    responseId: string;
  };
}

export default async function CreateWithResponsePage({
  params,
}: CreateWithResponsePageProps) {
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

  const responseId = parseInt(params.responseId);
  if (isNaN(responseId)) {
    notFound();
  }

  // Fetch the response to ensure it exists and belongs to the user
  const response = await api.response.getResponseById({ id: responseId });
  if (!response || response.createdById !== session.user.id) {
    notFound();
  }

  return (
    <HydrateClient>
      <ChatInterface continueFromResponse={response} />
    </HydrateClient>
  );
}
