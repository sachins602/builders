"use client";

import React from 'react';
import { Button } from "./ui/button";
import { Send } from 'lucide-react';
import type { ResponseWithImage } from './input'; // Assuming ResponseWithImage is exported from input.tsx or a types file

interface MessageInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  handleGenerateImage: () => void;
  isGenerating: boolean;
  selectedResponseId: number | null;
  lastImage: { id: number; url: string } | undefined | null;
  responseChain: ResponseWithImage[];
  handleResetSelection: () => void;
}

export function MessageInput({
  prompt,
  setPrompt,
  handleGenerateImage,
  isGenerating,
  selectedResponseId,
  lastImage,
  responseChain,
  handleResetSelection,
}: MessageInputProps) {
  return (
    <div className="border-t border-gray-700 bg-gray-800 p-4 flex-shrink-0">
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (prompt.trim() && !isGenerating && (selectedResponseId || lastImage)) {
                handleGenerateImage();
              }
            }
          }}
          placeholder={selectedResponseId
            ? "How would you like to modify this image?"
            : lastImage
            ? "Describe how you want to transform the image..."
            : "Select an image or wait for initial image to load..."}
          className="min-h-12 w-full resize-none rounded-lg border border-gray-600 bg-gray-700 p-3 pr-12 text-white focus:border-blue-500 focus:outline-none"
          disabled={isGenerating || (!selectedResponseId && !lastImage)}
        />
        <Button
          onClick={handleGenerateImage}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2"
          variant="ghost"
          size="icon"
          disabled={isGenerating || !prompt.trim() || (!selectedResponseId && !lastImage)}
        >
          <Send className="h-5 w-5 text-blue-400" />
        </Button>
      </div>

      <div className="mt-2 flex justify-between text-xs text-gray-400">
        <div>
          {selectedResponseId
            ? "Continuing from selected image"
            : lastImage
            ? "Using reference image"
            : "No image selected"}
        </div>
        {responseChain.length > 0 && (
          <Button
            onClick={handleResetSelection}
            variant="ghost"
            size="sm"
            className="text-xs text-gray-400 hover:text-gray-300"
          >
            New conversation
          </Button>
        )}
      </div>
    </div>
  );
}
