"use client";
import { toast } from "sonner";
import { Button } from "./ui/button";

export function ShareButton() {
  return (
    <Button
      onClick={() => {
        void navigator.clipboard.writeText(window.location.href);
        toast.success("URL copied to clipboard");
      }}
    >
      Share
    </Button>
  );
}
