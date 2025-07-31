import { api } from "~/trpc/server";
import { getImageUrl } from "~/lib/image-utils";
import Image from "next/image";

interface RemixPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RemixPage({ params }: RemixPageProps) {
  const resolvedParams = await params;
  const imageId = parseInt(resolvedParams.id);

  // Validate ID
  if (isNaN(imageId)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Invalid Image ID</h1>
          <p className="text-gray-600">The provided image ID is not valid.</p>
        </div>
      </div>
    );
  }

  // Fetch the image data
  const image = await api.response.getImageById({ id: imageId });

  if (!image) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Image Not Found</h1>
          <p className="text-gray-600">
            The requested image could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Remix Image</h1>
        <p className="text-gray-600">Transform this street view image</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Image Display */}
        <div className="space-y-4">
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">Original Image</h2>
            <img
              src={getImageUrl(image.url)}
              alt={image.address ?? "Street view"}
              className="h-auto w-full rounded-lg shadow-md"
            />
          </div>

          {/* Image Details */}
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-3 text-lg font-semibold">Image Details</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Address:</span>{" "}
                {image.address ?? "Unknown"}
              </p>
              <p>
                <span className="font-medium">Property Type:</span>{" "}
                {image.propertyType ?? "N/A"}
              </p>
              <p>
                <span className="font-medium">Building Type:</span>{" "}
                {image.buildingType ?? "N/A"}
              </p>
              {image.buildingArea && (
                <p>
                  <span className="font-medium">Building Area:</span>{" "}
                  {image.buildingArea} m²
                </p>
              )}
              <p>
                <span className="font-medium">Coordinates:</span> {image.lat},{" "}
                {image.lng}
              </p>
            </div>
          </div>
        </div>

        {/* Remix Controls */}
        <div className="space-y-4">
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">Start Remixing</h3>
            <p className="mb-4 text-gray-600">
              Use AI to transform this street view image. Describe what changes
              you&apos;d like to make.
            </p>

            {/* TODO: Add remix interface here */}
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <p className="text-gray-500">Remix interface coming soon...</p>
              <p className="mt-2 text-sm text-gray-400">
                This will connect to the AI image editing functionality
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
