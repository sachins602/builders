import { Button } from "../ui/button";
import { Search, Hammer, Edit } from "lucide-react";
import type { PropertyData } from "./types";

interface ToolBarProps {
  onSearchClick: () => void;
  showBuildEditButtons: boolean;
  existingImageId?: number | null;
  // Indicates if a build exists for the current address
  // This is used to determine if the "Remix" button should be shown
  buildExists: boolean;
  selectedParcel?: PropertyData | null;
}

export function ToolBar({
  onSearchClick,
  showBuildEditButtons,
  existingImageId,
  buildExists,
  selectedParcel,
}: ToolBarProps) {
  return (
    <div className="flex w-full flex-row justify-center gap-4">
      <Button variant="secondary" onClick={onSearchClick}>
        <Search className="m-2 h-16 w-16" />
        <span>Search</span>
      </Button>

      {showBuildEditButtons && (
        <div className="flex flex-row gap-4">
          <Button
            variant="secondary"
            onClick={() => {
              window.location.href = "/create";
            }}
          >
            <Hammer className="m-2 h-16 w-16" />
            <span>Build</span>
          </Button>

          {/* Only show Remix button when a parcel is selected */}
          {selectedParcel && (
            <Button
              variant="secondary"
              onClick={() => {
                window.location.href = `/remix/${selectedParcel.id}`;
              }}
            >
              <Edit className="m-2 h-16 w-16" />
              <span>Remix</span>
            </Button>
          )}

          {/* Show Edit button for other cases (non-parcel selections) */}
          {!selectedParcel && showBuildEditButtons && (
            <Button
              variant="secondary"
              onClick={() => {
                if (existingImageId) {
                  window.location.href = `/create/${existingImageId}`;
                } else {
                  window.location.href = "/edit";
                }
              }}
            >
              <Edit className="m-2 h-16 w-16" />
              <span>Edit</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
