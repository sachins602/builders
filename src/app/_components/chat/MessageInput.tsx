"use client";

import React from "react";
import { Button } from "../ui/button";
import { Plus, Send } from "lucide-react";

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

  const prePrompts = [
    "🏠 Building Form and Massing",
    "🎨 Architectural Style",
    "🌳 Landscaping and Streetscape",
    "🪟 Facade and Features",
    "🧹 Site Cleanup and Preparation",
    "👥 Community Feel",
  ];

  return (
    <div className="flex-shrink-0 border-t bg-white p-4">
      {!hasActiveConversation && canGenerate && (
        <div className="mb-3">
          <div className="mb-2">
            <span className="text-sm font-medium text-gray-600">
              Quick prompts
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {prePrompts.map((prePrompt) => (
              <Button
                key={prePrompt}
                variant="outline"
                size="sm"
                onClick={() =>
                  onPromptChange(prompt ? `${prompt} ${prePrompt}` : prePrompt)
                }
                disabled={isGenerating}
                className="text-sm"
              >
                {prePrompt}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholderText()}
          className="w-full resize-none rounded-lg border bg-gray-50 p-3 pr-12 text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          disabled={isGenerating || !canGenerate}
          rows={1}
        />
        <Button
          onClick={onGenerate}
          className="absolute top-1/2 right-2 -translate-y-1/2"
          variant="ghost"
          size="icon"
          disabled={isGenerating || !prompt.trim() || !canGenerate}
        >
          <Send className="h-5 w-5 text-blue-500" />
        </Button>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {isGenerating
            ? "Generating..."
            : canGenerate
              ? "Ready"
              : "Select an image"}
        </p>

        {hasActiveConversation && (
          <Button
            onClick={onReset}
            variant="ghost"
            size="sm"
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Start New Conversation
          </Button>
        )}
      </div>
    </div>
  );
}
