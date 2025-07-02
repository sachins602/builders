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

export function MessageInput2({
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

  //   const prePrompts = [
  //     "Remove trees",
  //     "Remove cars",
  //     "Isolate the building",
  //     "Make it 5 storeys taller",
  //     "Make the facade more home-like",
  //     "Add dormers",
  //     "Make it look more victorian",
  //   ];

  const prePromptsJSON = {
    buildingFormAndMassing: [
      "Replace the house with a duplex",
      "Add a second story",
      "Convert this into a fourplex",
      "Add a laneway house in the backyard",
      "Extend the building to the lot line",
      "Add a row of townhomes",
    ],
    architecturalStyle: [
      "Make it look more Victorian",
      "Give it a modern minimalist look",
      "Add Craftsman-style details",
      "Make it look like a mid-century building",
      "Use brick and stone materials",
    ],
    landscapingAndStreetscape: [
      "Add trees and greenery",
      "Include a front garden",
      "Add a bike lane and wider sidewalk",
      "Replace the driveway with permeable pavers",
      "Add a community bench or parklet",
    ],
    facadeAndFeatures: [
      "Add balconies",
      "Add dormers",
      "Make the facade more home-like",
      "Add large windows",
      "Include a front porch",
    ],
    siteCleanupAndPrep: [
      "Remove cars from the driveway",
      "Remove objects in front of the house",
      "Isolate the building",
      "Clear the lot for redevelopment",
    ],
    communityFeel: [
      "Add people walking and biking",
      "Show a family on the porch",
      "Add a small café or corner store",
      "Make it look like a co-housing community",
    ],
  };

  const prePromptsFriendlyNames = {
    buildingFormAndMassing: "🏠 Building Form and Massing",
    architecturalStyle: "🎨 Architectural Style",
    landscapingAndStreetscape: "🌳 Landscaping and Streetscape",
    facadeAndFeatures: "🪟 Facade and Features",
    siteCleanupAndPrep: "🧹 Site Cleanup and Preparation",
    communityFeel: "👥 Community Feel",
  };

  return (
    <div className="flex-shrink-0 border-t bg-white p-4">
      {!hasActiveConversation && canGenerate && (
        <div className="mb-3">
          <div className="mb-2">
            <span className="text-sm font-medium text-gray-600">
              Quick prompts
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(prePromptsJSON).map(([category, prompts]) => (
              <div key={category} className="w-full">
                <select
                  className="w-full rounded border px-2 py-1 text-sm"
                  disabled={isGenerating}
                  defaultValue=""
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                      onPromptChange(prompt ? `${prompt} ${value}` : value);
                      e.target.selectedIndex = 0; // reset dropdown
                    }
                  }}
                >
                  <option value="" disabled>
                    {prePromptsFriendlyNames[
                      category as keyof typeof prePromptsFriendlyNames
                    ] ?? `Select a prompt for ${category}`}
                  </option>
                  {prompts.map((prePrompt) => (
                    <option key={prePrompt} value={prePrompt}>
                      {prePrompt}
                    </option>
                  ))}
                </select>
              </div>
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
