"use client";

import React from "react";
import { Button } from "../ui/button";
import { Send } from "lucide-react";

interface MessageInputProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  onReset: () => void;
  isGenerating: boolean;
  canGenerate: boolean;
  hasActiveConversation: boolean;
}

export function MessageInput({
  prompt,
  onPromptChange,
  onGenerate,
  onReset,
  isGenerating,
  canGenerate,
  hasActiveConversation,
}: MessageInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim() && !isGenerating && canGenerate) {
        onGenerate();
      }
    }
  };

  const getPlaceholderText = () => {
    if (!canGenerate) {
      return "Select an image or wait for initial image to load...";
    }
    return hasActiveConversation
      ? "How would you like to modify this image?"
      : "Describe how you want to transform the image...";
  };

  const getStatusText = () => {
    if (hasActiveConversation) {
      return "Continuing from selected image";
    }
    return canGenerate ? "Using reference image" : "No image selected";
  };

  return (
    <div className="flex-shrink-0 border-t border-gray-700 bg-gray-800 p-4">
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholderText()}
          className="min-h-12 w-full resize-none rounded-lg border border-gray-600 bg-gray-700 p-3 pr-12 text-white focus:border-blue-500 focus:outline-none"
          disabled={isGenerating || !canGenerate}
        />
        <Button
          onClick={onGenerate}
          className="absolute top-1/2 right-2 -translate-y-1/2 p-2"
          variant="ghost"
          size="icon"
          disabled={isGenerating || !prompt.trim() || !canGenerate}
        >
          <Send className="h-5 w-5 text-blue-400" />
        </Button>
      </div>

      <div className="mt-2 flex justify-between text-xs text-gray-400">
        <div>{getStatusText()}</div>
        {hasActiveConversation && (
          <Button
            onClick={onReset}
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
