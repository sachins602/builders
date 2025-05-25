"use client";
import { api } from "~/trpc/react";

export function ProompInput() {
  const { data, isLoading } = api.post.getLastImage.useQuery();

  return (
    <div>
      {data && <img src={data.url} alt="Street View" className="h-24 w-24" />}
      <input
        type="text"
        placeholder="Enter the instructions for the image"
        className="rounded-md border-2 border-white bg-gray-800 p-2"
      />
      <button className="w-36 rounded-md border-2 border-white bg-gray-800 p-2">
        Generate
      </button>
    </div>
  );
}
