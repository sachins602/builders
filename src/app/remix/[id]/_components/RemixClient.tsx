"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/app/_components/ui/button";
import { Input } from "~/app/_components/ui/input";
import { Label } from "~/app/_components/ui/label";
import ResponseChains from "./ResponseChains";
import { Loading } from "~/app/_components/ui/loading";

type ImageData = {
  id: number;
  name: string | null;
  url: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  propertyType: string | null;
  buildingType: string | null;
  buildingArea: number | null;
  createdAt: Date;
};

type ResponseData = {
  id: number;
  prompt: string;
  url: string;
  createdAt: Date;
  previousResponseId: number | null;
};

type ResponseChain = ResponseData[];

interface RemixClientProps {
  image: ImageData;
  responseChains: ResponseChain[];
}

export function RemixClient({ image, responseChains }: RemixClientProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Refetch response chains when a new one is created
  const { refetch: refetchChains } =
    api.response.getResponseChainsByImageId.useQuery(
      { imageId: image.id },
      {
        refetchOnMount: false,
      },
    );

  // Mutations for creating new chains
  const createChainMutation =
    api.response.createNewChainFromImage.useMutation();
  const generateImageMutation = api.openai.generateFromImage.useMutation();

  const handleCreateNewChain = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      // Step 1: Create the response record
      const response = await createChainMutation.mutateAsync({
        imageId: image.id,
        prompt: prompt.trim(),
      });

      // Step 2: Generate the image and update the response
      await generateImageMutation.mutateAsync({
        responseId: response.id,
        imageUrl: image.url,
      });

      // Reset form and refresh data
      setPrompt("");
      await refetchChains();
    } catch (error) {
      console.error("Failed to create new chain:", error);
      alert("Failed to create new chain. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Create New Response Chain Section */}
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-xl font-semibold">
          Create New Response Chain
        </h3>
        <p className="mb-4 text-gray-600">
          Start a new AI-powered response chain from this original image. This
          will create a new independent chain separate from any existing
          responses.
        </p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="prompt">Transformation Prompt</Label>
            <Input
              id="prompt"
              type="text"
              placeholder="Describe how you want to transform this image..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              className="mt-1"
            />
          </div>

          <Button
            onClick={handleCreateNewChain}
            disabled={!prompt.trim() || isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loading className="mr-2 h-4 w-4" />
                Generating...
              </>
            ) : (
              "Create New Chain"
            )}
          </Button>
        </div>
      </div>

      {/* Existing Response Chains Section */}
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-xl font-semibold">
          Existing Response Chains ({responseChains.length})
        </h3>
        <ResponseChains
          chains={responseChains}
          onChainUpdated={() => refetchChains()}
        />
      </div>
    </>
  );
}
