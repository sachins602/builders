import { Button } from "../ui/button";
import { Search, Hammer, Edit } from "lucide-react";

interface ToolBarProps {
  onSearchClick: () => void;
  showBuildEditButtons: boolean;
  existingImageId?: number | null;
}

export function ToolBar({
  onSearchClick,
  showBuildEditButtons,
  existingImageId,
}: ToolBarProps) {
  return (
    <div className="flex w-full flex-row justify-center gap-4">
      <Button variant="secondary" onClick={onSearchClick}>
        <Search className="m-2 h-28 w-28 scale-250" />
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
            <Hammer className="m-2 h-28 w-28 scale-250" />
            <p>Build</p>
          </Button>

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
            <Edit className="m-2 h-28 w-28 scale-250" />
            <p>Edit</p>
          </Button>
        </div>
      )}
    </div>
  );
}
