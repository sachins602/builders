"use client";

import React from "react";
import { Image as ImageIcon, Sparkles } from "lucide-react";
import type { ResponseWithImage, Image } from "~/types/chat";

interface ChatAreaProps {
  lastImage: Image | null;
  responseChain: ResponseWithImage[];
  isGenerating: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatArea({
  lastImage,
  responseChain,
  isGenerating,
  messagesEndRef,
}: ChatAreaProps) {
  const originalImage =
    responseChain.find((r) => !r.previousResponseId)?.sourceImage ?? lastImage;
  const showWelcomeMessage = !originalImage && !isGenerating;

  return (
    <div className="h-full flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-4xl">
        {originalImage && (
          <div className="mb-6 rounded-lg border bg-white p-4">
            <div className="mb-2 flex items-center text-sm font-semibold text-gray-700">
              <ImageIcon className="mr-2 h-5 w-5" />
              <span>
                {responseChain.length > 0
                  ? "Original Image"
                  : "Reference Image"}
              </span>
            </div>
            <img
              src={originalImage.url}
              alt={
                responseChain.length > 0 ? "Original image" : "Reference image"
              }
              className="max-h-72 w-full rounded-md object-contain"
            />
            {originalImage.address && (
              <p className="mt-2 text-center text-xs text-gray-500">
                {originalImage.address}
              </p>
            )}
          </div>
        )}

        {responseChain.map((response) => (
          <div key={response.id} className="mb-6">
            <div className="mb-4 flex items-end justify-end gap-2">
              <div className="max-w-xl rounded-2xl rounded-br-none bg-blue-500 p-4 text-white">
                <p>{response.prompt}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
                <Sparkles className="h-6 w-6 text-gray-600" />
              </div>
              <div className="max-w-xl rounded-2xl rounded-bl-none border bg-white p-2">
                <img
                  src={response.url}
                  alt={`AI generated image`}
                  className="max-h-80 rounded-lg object-contain"
                />
              </div>
            </div>
          </div>
        ))}

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

        {showWelcomeMessage && (
          <div className="text-center text-gray-500">
            <Sparkles className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <h3 className="text-xl font-semibold">Welcome to AI Image Chat</h3>
            <p className="mt-2">
              Start by selecting an image on the map, or describe how you&apos;d
              like to transform a previous generation.
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
