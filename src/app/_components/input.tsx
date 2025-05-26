"use client";
import { api } from "~/trpc/react";
import { Button } from "./ui/button";

export function ProompInput() {
  const { data, isLoading } = api.post.getLastImage.useQuery();

  return (
    <div className="flex w-full flex-row">
      {data && (
        <img src={data.url} alt="Street View" className="h-96 max-w-1/2" />
      )}
      <div className="flex w-full flex-row rounded-md border-2 border-white">
        <input
          type="text"
          placeholder="Enter the instructions for the image"
          className="w-full p-2"
        />
        <Button className="mr-2 mb-4 self-end" variant="default" size="sm">
          Generate
        </Button>
      </div>
    </div>
  );
}
