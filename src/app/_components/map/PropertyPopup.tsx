import { getImageUrl } from "~/lib/image-utils";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

interface PropertyPopupProps {
  isLoadingImage: boolean;
  imageData?: {
    url: string;
  };
  existingImageData?: {
    id: number;
    url: string;
    address?: string | null;
    buildingType?: string | null;
    buildingArea?: number | null;
    propertyType?: string | null;
  } | null;
}

export function PropertyPopup({
  isLoadingImage,
  imageData,
  existingImageData,
}: PropertyPopupProps) {
  // If we have existing image data, show that with parcel info
  if (existingImageData) {
    return (
      <div className="flex w-64 flex-col gap-2">
        <img
          className="h-48 w-64 rounded-lg"
          src={getImageUrl(existingImageData.url)}
          alt="Street view"
        />
        <div className="space-y-1 p-2">
          <h3 className="text-sm font-semibold">
            {existingImageData.address ?? "Property Information"}
          </h3>
          <div className="space-y-1 text-xs text-gray-600">
            {existingImageData.buildingType && (
              <div>Type: {existingImageData.buildingType}</div>
            )}
            {existingImageData.buildingArea && (
              <div>Area: {Math.round(existingImageData.buildingArea)} m²</div>
            )}
            {existingImageData.propertyType && (
              <div>Use: {existingImageData.propertyType}</div>
            )}
          </div>
          <Button
            onClick={() =>
              (window.location.href = `/create/${existingImageData.id}`)
            }
            className="mt-2 w-full"
          >
            Edit This Property
          </Button>
        </div>
      </div>
    );
  }

  // Original loading/new image logic
  return (
    <div className="flex w-64 flex-col gap-2">
      {isLoadingImage ? (
        <Skeleton className="h-48 w-64 rounded-xl" />
      ) : imageData ? (
        <img
          className="h-48 w-64"
          src={getImageUrl(imageData.url)}
          alt="Street view"
        />
      ) : (
        <p>No image available for this location.</p>
      )}
    </div>
  );
}
