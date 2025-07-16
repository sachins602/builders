"use client";

import React, { useState, useEffect } from "react";
import {
  Image as ImageIcon,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { ResponseWithImage, Image } from "~/types/chat";
import { getImageUrl } from "~/lib/image-utils";
import { Skeleton } from "../ui/skeleton";


interface ChatAreaProps {
  lastImage: Image | null;
  responseChain: ResponseWithImage[];
  isGenerating: boolean;
}

type ImageData =
  | { type: "original"; image: Image; prompt: null }
  | {
    type: "generated";
    image: { url: string; address?: string };
    prompt: string;
  };

export function ChatArea({
  lastImage,
  responseChain,
  isGenerating,
}: ChatAreaProps) {
  const originalImage =
    responseChain.find((r) => !r.previousResponseId)?.sourceImage ?? lastImage;

  // Navigation state
  const [currentIndex, setCurrentIndex] = useState(0);

  // Create array of all images (original + generated)
  const allImages = React.useMemo((): ImageData[] => {
    const images: ImageData[] = [];
    if (originalImage) {
      images.push({
        type: "original",
        image: originalImage,
        prompt: null,
      });
    }
    responseChain.forEach((response) => {
      images.push({
        type: "generated",
        image: {
          url: response.url,
          address: originalImage?.address ?? undefined,
        },
        prompt: response.prompt,
      });
    });
    return images;
  }, [originalImage, responseChain]);

  // Update current index when new images are generated
  useEffect(() => {
    if (responseChain.length > 0) {
      // When there are generated images, automatically navigate to the latest one
      setCurrentIndex(allImages.length - 1);
    }
  }, [responseChain.length, allImages.length]);

  const showWelcomeMessage = !originalImage && !isGenerating;
  const hasMultipleImages = allImages.length > 1;
  const currentImageData = allImages[currentIndex];

  const navigateLeft = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
  };

  const navigateRight = () => {
    setCurrentIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="h-full flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl">
        {/* Current Image Display */}
        {currentImageData && (
          <div className="bg-white p-4">

            {/* Image Area */}
            <div className="flex flex-row items-center justify-center ">
              {/*Left Chevron  */}
              {hasMultipleImages && (
                <button
                  onClick={navigateLeft}
                  className="flex items-center justify-center rounded-full bg-gray-100 p-2 transition-colors hover:bg-gray-200 mr-2 h-10 w-10"
                  style={{ aspectRatio: "1 / 1" }}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}

              {/* Image Display */}
              <div>
                <div
                  className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-white px-4 py-1 shadow-md"
                  style={{ minWidth: 80, textAlign: "center" }}
                >
                  {hasMultipleImages && (
                  <span className="text-sm font-medium text-gray-600">
                    {currentIndex + 1} of {allImages.length}
                  </span>
                  )}
                </div>

                {(!isGenerating && (<img
                  src={getImageUrl(currentImageData.image.url)}
                  alt={
                    currentImageData.type === "original"
                      ? "Original image"
                      : "Generated image"
                  }
                  className="max-h-72 w-full rounded-md object-contain"
                />)) ?? (<Skeleton className="h-72 w-full rounded-md" />)}

                {/* Address */}
                {currentImageData.image.address && (
                  <p className="text-center text-xs text-gray-500">
                    {currentImageData.image.address}
                  </p>
                )}
              </div>

              {/*Right Chevron  */}
              {hasMultipleImages && (
                <button
                  onClick={navigateRight}
                  className="flex items-center justify-center rounded-full bg-gray-100 p-2 transition-colors hover:bg-gray-200 ml-2 h-10 w-10"
                  style={{ aspectRatio: "1 / 1" }}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Prompt */}
          </div>
        )}

        {/* Loading State */}
        {isGenerating && (
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
              <Sparkles className="h-6 w-6 text-gray-600" />
            </div>
            <div className="rounded-2xl rounded-bl-none border bg-white p-4">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500"></div>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Message */}
        {showWelcomeMessage && (
          <div className="text-center text-gray-500">
            <Sparkles className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="text-xl font-semibold">Welcome to AI Image Chat</h3>
            <p className="">
              Start by selecting an image on the map, or describe how you&apos;d
              like to transform a previous generation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
