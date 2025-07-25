import { getImageUrl } from "~/lib/image-utils";

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
        <div className="h-48 w-64 animate-pulse rounded-lg bg-gray-300" />
      ) : imageData ? (
        <img
          className="h-48 w-64 rounded-lg"
          src={getImageUrl(imageData.url)}
          alt="Street view"
        />
      ) : (
        <p>No image available for this location.</p>
      )}
    </div>
  );
}
