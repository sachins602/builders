"use client";

import React from "react";
import { Button } from "../ui/button";
import { Plus, Send } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
} from "../ui/dropdown-menu";

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
      ? "How would you like to modify this building?"
      : "Describe how you want to transform the image...";
  };
  const prePromptsJSON = {
    buildingFormAndMassing: [
      "Replace the house with a duplex",
      "Add a second story",
      "Convert this into a fourplex",
      "Extend the building to the lot line",
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
    <div className="flex-shrink-0 bg-white">
      {canGenerate && (
        <div>
          <span className="text-sm font-medium text-gray-600">
            Quick prompts
          </span>
          {/* Quick prompts dropdowns - desktop and tablet only */}
          <div className="hidden grid-cols-2 gap-2 sm:grid">
            {Object.entries(prePromptsJSON).map(([key, prompts]) => (
              <div key={key} className="col-span-1">
                <select
                  className="w-full rounded border bg-white px-2 py-1 text-sm text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  disabled={isGenerating}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                      onPromptChange(prompt ? `${prompt} ${value}` : value);
                      e.target.selectedIndex = 0; // Reset dropdown after selection
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    {
                      prePromptsFriendlyNames[
                        key as keyof typeof prePromptsFriendlyNames
                      ]
                    }
                  </option>
                  {prompts.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Quick prompts dropdown single dropdown to save vertical space - mobile only */}
          <div className="sm:hidden">
            {/* Using shadcn/ui DropdownMenu for mobile quick prompts */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Quick prompts
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="max-h-60">
                {Object.entries(prePromptsJSON).map(([key, prompts]) => (
                  <React.Fragment key={key}>
                    <DropdownMenuLabel className="font-semibold opacity-80">
                      {
                        prePromptsFriendlyNames[
                          key as keyof typeof prePromptsFriendlyNames
                        ]
                      }
                    </DropdownMenuLabel>
                    {prompts.map((p) => (
                      <DropdownMenuItem
                        key={p}
                        onSelect={() => {
                          onPromptChange(prompt ? `${prompt} ${p}` : p);
                        }}
                      >
                        {p}
                      </DropdownMenuItem>
                    ))}
                  </React.Fragment>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      <div className="relative mt-1 mb-1">
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={(e) => {
            handleKeyDown(e);
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              prompt.trim() &&
              !isGenerating &&
              canGenerate
            ) {
              onGenerate(); // Trigger generation logic
            }
          }}
          placeholder={getPlaceholderText()}
          className="sm:rows-1 w-full resize-none rounded-lg border bg-gray-50 p-3 pr-12 text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          disabled={isGenerating || !canGenerate}
          rows={1}
          style={{ height: "75px" }}
        />
        <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-gray-200 transition-colors hover:bg-gray-400">
            <Button
              onClick={() => {
                onGenerate();
                onPromptChange("");
              }}
              className="flex text-black"
              variant="ghost"
              size="icon"
              disabled={isGenerating || !prompt.trim() || !canGenerate}
              style={{ boxShadow: "none" }}
            >
              <Send className="size-8 text-black" />
            </Button>
          </span>
        </div>
      </div>
    </div>
  );
}
