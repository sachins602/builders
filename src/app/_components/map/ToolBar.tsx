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
  // Add new prop to distinguish between different selection types
  hasParcelData: boolean;
}

export function ToolBar({
  onSearchClick,
  showBuildEditButtons,
  selectedParcel,
  hasParcelData,
}: ToolBarProps) {
  return (
    <div className="flex w-full flex-row justify-center gap-4">
      {/* Search button - always visible when search bar is minimized */}
      <Button variant="secondary" onClick={onSearchClick}>
        <Search className="m-2 h-16 w-16" />
        <span>Search</span>
      </Button>

      {/* Build/Edit buttons - only show when there's a selection */}
      {showBuildEditButtons && (
        <div className="flex flex-row gap-4">
          {/* Build button - only show when there's a position selection (PropertyPopup case) */}
          {!hasParcelData && (
            <Button
              variant="secondary"
              onClick={() => {
                window.location.href = "/create";
              }}
            >
              <Hammer className="m-2 h-16 w-16" />
              <span>Build</span>
            </Button>
          )}

          {/* Remix button - only show when a parcel with data is selected */}
          {hasParcelData && selectedParcel && (
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
        </div>
      )}
    </div>
  );
}
