"use client";
import { api } from "~/trpc/react";

export default function Create() {
  const [image] = api.post.getLastImage.useSuspenseQuery();

  console.log("Image data", image);
  return (
    <div className="flex flex-col gap-4 bg-gray-700 text-white">
      <h1 className="text-2xl">Create</h1>
      <div className="h-[300px] w-full">output</div>
      {image && (
        <img
          src={image.url}
          alt="Street View"
          className="h-96 w-96 border-2 border-white"
        />
      )}
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
