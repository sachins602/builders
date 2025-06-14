"use client";

import React from 'react';
import { Image as ImageIcon, Sparkles } from 'lucide-react'; // Renamed to avoid conflict with img tag
import type { ResponseWithImage } from './input'; // Assuming ResponseWithImage is exported from input.tsx or a types file

interface ChatAreaProps {
  lastImage: { id: number; url: string } | undefined | null;
  responseChain: ResponseWithImage[];
  isGenerating: boolean;
  generatedImage: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatArea({
  lastImage,
  responseChain,
  isGenerating,
  generatedImage,
  messagesEndRef,
}: ChatAreaProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Reference image */}
      {lastImage && responseChain.length === 0 && (
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <ImageIcon className="h-5 w-5 text-gray-300 mr-2" />
            <span className="text-sm text-gray-300">Reference Image</span>
          </div>
          <img
            src={lastImage.url}
            alt="Reference image"
            className="max-h-64 rounded-md object-cover"
          />
        </div>
      )}

      {/* Message thread */}
      {responseChain.map((response, index) => (
        <div key={response.id} className="mb-4">
          {/* User prompt */}
          <div className="mb-4 flex justify-end">
            <div className="max-w-3xl">
              <div className="rounded-lg bg-blue-600 p-3 text-white">
                {response.proompt}
              </div>
              <div className="mt-1 text-xs text-gray-400 text-right">
                {new Date(response.createdAt).toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* AI response */}
          <div className="flex">
            <div className="mr-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-700">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="max-w-3xl rounded-lg bg-gray-800 p-3">
              <img
                src={response.url}
                alt={`AI generated image ${index}`}
                className="max-h-64 rounded-md object-cover"
              />
            </div>
          </div>
        </div>
      ))}

      {/* Loading indicator */}
      {isGenerating && (
        <div className="mb-4 flex">
          <div className="mr-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-700">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="rounded-lg bg-gray-800 p-3">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 animate-bounce rounded-full bg-purple-500"></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-purple-500" style={{ animationDelay: '0.2s' }}></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-purple-500" style={{ animationDelay: '0.4s' }}></div>
              <span className="ml-2 text-sm text-gray-400">Generating...</span>
            </div>
          </div>
        </div>
      )}

      {/* Single generated image (when not part of a chain yet) */}
      {generatedImage && responseChain.length === 0 && !isGenerating && (
        <div className="mb-4 flex">
          <div className="mr-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-700">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="max-w-3xl">
            <div className="rounded-lg bg-gray-800 p-3">
              <img
                src={generatedImage}
                alt="Generated image"
                className="max-h-64 rounded-md object-cover"
              />
            </div>
          </div>
        </div>
      )}

      {/* Welcome message */}
      {!lastImage && !responseChain.length && !generatedImage && !isGenerating && (
        <div className="mb-4 flex">
          <div className="mr-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-700">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="rounded-lg bg-gray-800 p-3">
            <p className="text-sm text-gray-300">
              Welcome to AI Image Chat! Describe how you&apos;d like to transform an image or select a previous generation.
            </p>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
