"use client";
import { Button } from "../ui/button";
import { TrendingUp, Users } from "lucide-react";

export function NavigationButtons() {
  return (
    <div className="flex w-full flex-row justify-between">
      <Button
        variant="secondary"
        onClick={() => {
          window.location.href = "/popular";
        }}
      >
        <TrendingUp className="h-16 w-16" />
        <span className="font-bold">Popular</span>
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          window.location.href = "/organizations";
        }}
      >
        <Users className="h-16 w-16" />
        <span className="font-bold">Community</span>
      </Button>
    </div>
  );
}
