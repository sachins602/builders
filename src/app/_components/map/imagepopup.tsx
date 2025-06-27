import { Marker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "~/trpc/react";
import { getImageUrl } from "~/lib/image-utils";

// Define the expected shape of the image data from the API
interface ImageDataFromApi {
  id: number; // Or string, depending on your schema
  url: string;
  name?: string | null;
  lat?: number | null;
  lng?: number | null;
}

// Define the shape of the image data after filtering, where lat/lng are guaranteed numbers
interface ValidatedImageData extends ImageDataFromApi {
  lat: number;
  lng: number;
}

export default function ImagePopup() {
  const imagesQuery = api.response.getImages.useQuery();

  const typedImages = imagesQuery.data as ImageDataFromApi[] | undefined;

  // Filter and type guard to ensure lat and lng are present and correctly typed.
  const filteredAndValidatedImages: ValidatedImageData[] =
    typedImages?.filter(
      (image): image is ValidatedImageData =>
        typeof image.lat === "number" &&
        typeof image.lng === "number" &&
        typeof image.url === "string" &&
        image.url.trim() !== "",
    ) ?? [];

  if (imagesQuery.isLoading) {
    return null; // Or a loading indicator if you prefer
  }

  if (!filteredAndValidatedImages || filteredAndValidatedImages.length === 0) {
    return null;
  }

  return filteredAndValidatedImages.map((image) => {
    return (
      <Marker key={image.id} position={[image.lat, image.lng]}>
        <Tooltip permanent={false} direction="top" offset={[0, -10]}>
          <img
            src={getImageUrl(image.url)}
            alt={image.name ?? "Street View Image"}
            className="block h-auto w-full"
            style={{ maxWidth: "150px" }}
          />
          {image.name && <p className="text-center">{image.name}</p>}
        </Tooltip>
      </Marker>
    );
  });
}
