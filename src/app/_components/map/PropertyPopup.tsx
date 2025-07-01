import { Skeleton } from "../ui/skeleton";
import type { NearbyImage } from "./types";

interface PropertyPopupProps {
  isLoadingImage: boolean;
  imageData?: {
    url: string;
  };
  isLoadingNearbyImages: boolean;
  nearbyImages?: NearbyImage[];
}

export function PropertyPopup({
  isLoadingImage,
  imageData,
  isLoadingNearbyImages,
  nearbyImages,
}: PropertyPopupProps) {
  return (
    <div className="flex w-64 flex-col gap-2">
      {isLoadingImage ? (
        <Skeleton className="h-48 w-64 rounded-xl" />
      ) : imageData ? (
        <img
          className="h-48 w-64"
          src={`/${imageData.url}`}
          alt="Street view"
        />
      ) : (
        <p>Failed to load image</p>
      )}

      <div className="mx-auto flex flex-row gap-2"></div>

      <div>
        <p>Previous Builds Nearby</p>
        <div className="flex flex-row gap-4">
          {isLoadingNearbyImages ? (
            <Skeleton className="h-16 w-14 rounded-xl" />
          ) : nearbyImages && nearbyImages.length > 0 ? (
            nearbyImages.map((image) => (
              <div
                key={image.id}
                className="h-16 w-14 cursor-pointer rounded-md bg-gray-400 p-1 shadow-2xl hover:bg-gray-200"
                onClick={() => {
                  window.location.href = `/create/${image.id}`;
                }}
              >
                <img
                  className="h-10 w-12"
                  src={`/${image.url}`}
                  alt={image.address ?? "Nearby Image"}
                />
                <div className="relative flex overflow-x-hidden">
                  <p className="animate-marquee whitespace-nowrap">
                    {image.address}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p>No nearby images</p>
          )}
        </div>
      </div>
    </div>
  );
}
