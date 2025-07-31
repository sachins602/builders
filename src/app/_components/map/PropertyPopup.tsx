import { getImageUrl } from "~/lib/image-utils";
import Loading from "../ui/loading";

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
        <div className="flex h-48 w-64 items-center justify-center">
          <Loading />
        </div>
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
