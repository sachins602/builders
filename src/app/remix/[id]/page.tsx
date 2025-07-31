import { api } from "~/trpc/server";
import { getImageUrl } from "~/lib/image-utils";
import { RemixClient } from "./_components/RemixClient";

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

  // Fetch the image data and response chains
  const [image, responseChains] = await Promise.all([
    api.response.getImageById({ id: imageId }).catch(() => null),
    api.response.getResponseChainsByImageId({ imageId }).catch(() => []),
  ]);

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

      <div className="grid grid-cols-1 gap-6">
        {/* Original Image Section */}
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold">Original Image</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <img
                src={getImageUrl(image.url)}
                alt={image.address ?? "Street view"}
                className="h-96 w-full rounded-lg object-cover shadow-md"
              />
            </div>
            <div>
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
        </div>

        {/* Client-side remix functionality */}
        <RemixClient image={image} responseChains={responseChains} />
      </div>
    </div>
  );
}
