import { Button } from "../ui/button";
import { Search, Hammer, Edit } from "lucide-react";

interface ToolBarProps {
  onSearchClick: () => void;
}

export function ToolBar({ onSearchClick }: ToolBarProps) {
  return (
    <div className="flex w-full flex-row justify-center">
      <Button
        variant="secondary"
        onClick={onSearchClick}
        className="m-2 flex h-24 w-24 flex-col p-2"
      >
        <Search className="m-2 h-32 w-32 scale-250" />
        <span>Search</span>
      </Button>

      <Button
        variant="secondary"
        onClick={() => {
          window.location.href = "/create2";
        }}
        className="m-2 flex h-24 w-24 flex-col p-2"
      >
        <Hammer className="m-2 h-32 w-32 scale-250" />
        <p>Build</p>
      </Button>

      <Button
        variant="secondary"
        onClick={() => {
          window.location.href = "/edit";
        }}
        className="m-2 flex h-24 w-24 flex-col p-2"
      >
        <Edit className="m-2 h-32 w-32 scale-250" />
        <p>Edit</p>
      </Button>
    </div>
  );
}
