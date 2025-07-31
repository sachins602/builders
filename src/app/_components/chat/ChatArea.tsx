"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ResponseWithImage, Image } from "~/types/chat";
import { getImageUrl } from "~/lib/image-utils";
import { Skeleton } from "../ui/skeleton";
import WelcomeMessage from "./WelcomeMessage";
import StreetAddress from "../StreetAddress";
import { Loading } from "../ui/loading";

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
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

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

  const showWelcomeMessage = originalImage && !isGenerating && !hasShownWelcome;

  // Mark welcome message as shown when it's displayed
  useEffect(() => {
    if (showWelcomeMessage) {
      setHasShownWelcome(true);
    }
  }, [showWelcomeMessage]);
  const hasMultipleImages = allImages.length > 1;
  const currentImageData = allImages[currentIndex];

  const navigateLeft = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
  };

  const navigateRight = () => {
    setCurrentIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col justify-center overflow-hidden">
      {currentImageData && (
        <div className="flex h-full w-full flex-row items-center justify-center bg-white p-2 sm:p-4">
          {/*Left Chevron  */}
          {hasMultipleImages && (
            <button
              onClick={navigateLeft}
              className="mr-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 p-2 transition-colors hover:bg-gray-200"
              style={{ aspectRatio: "1 / 1" }}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {/* Image Display */}
          <div className="relative flex h-full w-full max-w-full flex-col items-center">
            {hasMultipleImages && (
              <div
                className="absolute top-4 left-1/2 z-10 flex-grow -translate-x-1/2 rounded-full bg-white px-4 py-1 shadow-md"
                style={{ minWidth: 80, textAlign: "center" }}
              >
                <span className="text-sm font-medium text-gray-600">
                  {currentIndex + 1} of {allImages.length}
                </span>
              </div>
            )}

            <div className="flex h-full w-full max-w-full items-center justify-center">
              {isGenerating ? (
                <div className="relative">
                  <Loading className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  <Skeleton className="h-full w-full max-w-lg rounded-md" />
                </div>
              ) : (
                <img
                  src={getImageUrl(currentImageData.image.url)}
                  alt={
                    currentImageData.type === "original"
                      ? "Original image"
                      : "Generated image"
                  }
                  className="max-h-lg h-full w-auto rounded-md object-contain"
                  style={{ minHeight: 120, aspectRatio: "auto" }}
                />
              )}
            </div>

            {/* Address */}
            {currentImageData.image.address && (
              <div
                className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-row items-center justify-center rounded-full bg-white px-4 py-2 text-center shadow-md"
                style={{ zIndex: 20 }}
              >
                <StreetAddress address={currentImageData.image.address} />
              </div>
            )}
          </div>

          {/*Right Chevron  */}
          {hasMultipleImages && (
            <button
              onClick={navigateRight}
              className="ml-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 p-2 transition-colors hover:bg-gray-200"
              style={{ aspectRatio: "1 / 1" }}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      {/* Welcome Message */}
      {showWelcomeMessage && <WelcomeMessage />}
    </div>
  );
}
