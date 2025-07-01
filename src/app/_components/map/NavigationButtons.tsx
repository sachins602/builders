import { Button } from "../ui/button";
import { TrendingUp } from "lucide-react";

export function NavigationButtons() {
  return (
    <div className="flex w-full flex-row justify-between">
      <Button
        variant="secondary"
        className="m-2 flex h-24 w-32 flex-col p-2"
        onClick={() => {
          window.location.href = "/popular";
        }}
      >
        <TrendingUp className="h-16 w-16 scale-250" />
        <span className="text-lg">Popular</span>
      </Button>

      <Button
        variant="secondary"
        className="m-2 flex h-24 w-32 flex-col p-2"
        onClick={() => {
          window.location.href = "/community";
        }}
      >
        <TrendingUp className="h-16 w-16 scale-250" />
        <span className="text-lg">Community</span>
      </Button>
    </div>
  );
}
