import { getImageUrl } from "~/lib/image-utils";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

interface PropertyPopupProps {
  isLoadingImage: boolean;
  imageData?: {
    url: string;
  };
}

export function PropertyPopup({
  isLoadingImage,
  imageData,
}: PropertyPopupProps) {
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
