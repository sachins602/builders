import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { HydrateClient } from "~/trpc/server";
import { CreateFromImageClient } from "../../../_components/CreateFromImageClient";

interface PageProps {
  params: Promise<{
    imageId: string;
  }>;
}

export default async function CreateFromImagePage({ params }: PageProps) {
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
            Please sign in to create responses from this image.
          </p>
        </div>
      </div>
    );
  }

  const imageId = parseInt(resolvedParams.imageId);
  if (isNaN(imageId)) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-lg border bg-white p-8 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            Invalid Image ID
          </h2>
          <p className="text-gray-600">The provided image ID is not valid.</p>
        </div>
      </div>
    );
  }

  // Fetch the image to ensure it exists and user has access
  const image = await api.response.getImageById({ id: imageId });
  if (!image) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-lg border bg-white p-8 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            Image Not Found
          </h2>
          <p className="text-gray-600">
            The requested image could not be found or you don&apos;t have access
            to it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <HydrateClient>
      <CreateFromImageClient image={image} />
    </HydrateClient>
  );
}
