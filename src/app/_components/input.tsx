"use client";
import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "./ui/button";

export function ProompInput() {
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Query for the last image (street view)
  const { data: lastImage } = api.response.getLastImage.useQuery();

  // Mutation for generating AI image
  const generateImage = api.openai.generateImage.useMutation({
    onSuccess: (data) => {
      if (!data.url) {
        console.error("No image URL returned from API");
      }
      setGeneratedImage(data.url);
      setIsGenerating(false);
    },
    onError: (error) => {
      setIsGenerating(false);
      console.error("Failed to generate image. Please try again.", error);
    },
  });

  const handleGenerateImage = () => {
    if (!prompt.trim()) {
      console.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);

    // Pass the prompt, reference image URL, and selected style
    generateImage.mutate({
      prompt,
      imageUrl: lastImage?.url,
      imageId: lastImage?.id,
    });
  };

  return (
    <div className="flex w-full flex-col gap-6 md:flex-row">
      <div className="flex flex-1 flex-col gap-4">
        {lastImage && (
          <div className="rounded-lg bg-gray-800 p-4">
            <h3 className="mb-2 text-sm font-medium text-gray-300">
              Reference Image (Street View)
            </h3>
            <img
              src={lastImage.url}
              alt="Street View"
              className="h-64 w-full rounded-md object-cover"
            />
            <p className="mt-2 text-xs text-gray-400">
              This street view image will be used as a reference for the AI to
              understand the context.
            </p>
          </div>
        )}

        {generatedImage && (
          <div className="rounded-lg bg-gray-800 p-4">
            <h3 className="mb-2 text-sm font-medium text-gray-300">
              AI-Generated Image
            </h3>
            <img
              src={generatedImage}
              alt="AI Generated"
              className="h-64 w-full rounded-md object-cover"
            />
            <p className="mt-2 text-xs text-gray-400">
              The AI has generated this image based on your prompt and the
              reference image.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col">
        <div className="rounded-lg bg-gray-800 p-4">
          <h3 className="mb-2 text-lg font-medium">
            Transform Your Street View
          </h3>
          <p className="mb-4 text-sm text-gray-300">
            Describe how you want to transform the street view image. The AI
            will use your description to generate a new image inspired by the
            reference.
          </p>

          {/* Prompt input */}
          <div className="mb-4 flex flex-col rounded-md border border-gray-600 bg-gray-900 p-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Examples: 'Transform this into a futuristic cityscape', 'Make this look like a watercolor painting', 'Add trees and greenery to this street'..."
              className="min-h-32 w-full rounded-md bg-gray-900 p-2 text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
              disabled={isGenerating}
            />
          </div>

          {/* Generate button */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400">
              {lastImage
                ? "Using street view as reference"
                : "No reference image available"}
            </div>
            <Button
              onClick={handleGenerateImage}
              className=""
              variant="default"
              size="sm"
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? "Generating..." : "Transform Image"}
            </Button>
          </div>

          {/* Tips */}
          <div className="mt-4 rounded-md bg-gray-700 p-3">
            <h4 className="mb-1 text-sm font-medium">
              Tips for Better Results
            </h4>
            <ul className="list-disc pl-5 text-xs text-gray-300">
              <li>Be specific about the transformation you want</li>
              <li>Mention specific architectural styles or time periods</li>
              <li>Describe lighting conditions (sunny, rainy, night, etc.)</li>
              <li>Specify the season or weather changes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
