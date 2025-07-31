"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/app/_components/ui/button";
import { Input } from "~/app/_components/ui/input";
import { Label } from "~/app/_components/ui/label";
import { getImageUrl } from "~/lib/image-utils";
import { Loading } from "~/app/_components/ui/loading";
import Link from "next/link";

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

interface CreateFromImageClientProps {
  image: ImageData;
}

export function CreateFromImageClient({ image }: CreateFromImageClientProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  // Mutations for creating new chains
  const createChainMutation =
    api.response.createNewChainFromImage.useMutation();
  const generateImageMutation = api.openai.generateFromImage.useMutation();

  const handleCreateChain = async () => {
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

      // Redirect back to remix page
      void router.push(`/remix/${image.id}`);
    } catch (error) {
      console.error("Failed to create new chain:", error);
      alert("Failed to create new chain. Please try again.");
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-4">
          <Link href={`/remix/${image.id}`}>
            <Button variant="outline" size="sm">
              ← Back to Remix
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Create New Response Chain
            </h1>
            <p className="text-gray-600">
              Transform this street view image with AI
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Original Image Section */}
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold">Original Image</h2>
          <div className="space-y-4">
            <img
              src={getImageUrl(image.url)}
              alt={image.address ?? "Street view"}
              className="h-96 w-full rounded-lg object-cover shadow-md"
            />
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Address:</span>{" "}
                {image.address ?? "Unknown"}
              </p>
              <p>
                <span className="font-medium">Property Type:</span>{" "}
                {image.propertyType ?? "N/A"}
              </p>
              <p>
                <span className="font-medium">Building Type:</span>{" "}
                {image.buildingType ?? "N/A"}
              </p>
              {image.buildingArea && (
                <p>
                  <span className="font-medium">Building Area:</span>{" "}
                  {image.buildingArea} m²
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Create Form Section */}
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold">Create Transformation</h2>
          <div className="space-y-6">
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isGenerating && prompt.trim()) {
                    void handleCreateChain();
                  }
                }}
              />
              <p className="mt-2 text-sm text-gray-500">
                Example: &ldquo;Add modern architecture&rdquo;, &ldquo;Change to
                winter scene&rdquo;, &ldquo;Add vegetation and trees&rdquo;
              </p>
            </div>

            <Button
              onClick={() => void handleCreateChain()}
              disabled={!prompt.trim() || isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loading className="mr-2 h-4 w-4" />
                  Generating Response...
                </>
              ) : (
                "Create Response Chain"
              )}
            </Button>

            {isGenerating && (
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-700">
                  🎨 Creating your response chain...
                </p>
                <p className="mt-1 text-xs text-blue-600">
                  This may take a few seconds as we generate your transformed
                  image.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
