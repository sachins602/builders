"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { getImageUrl } from "~/lib/image-utils";
import { Button } from "~/app/_components/ui/button";
import { Input } from "~/app/_components/ui/input";
import { Label } from "~/app/_components/ui/label";
import { Loading } from "~/app/_components/ui/loading";

type ResponseData = {
  id: number;
  prompt: string;
  url: string;
  createdAt: Date;
  previousResponseId: number | null;
};

type ResponseChain = ResponseData[];

interface ResponseItemProps {
  response: ResponseData;
  isLast: boolean;
  onChainContinued: () => void;
}

function ResponseItem({
  response,
  isLast,
  onChainContinued,
}: ResponseItemProps) {
  const [showContinueForm, setShowContinueForm] = useState(false);
  const [continuePrompt, setContinuePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Mutations for continuing chains
  const continueChainMutation =
    api.response.continueChainFromResponse.useMutation();
  const generateFromResponseMutation =
    api.openai.generateFromResponse.useMutation();

  const handleContinueChain = async () => {
    if (!continuePrompt.trim()) return;

    setIsGenerating(true);
    try {
      // Step 1: Create the response record
      const newResponse = await continueChainMutation.mutateAsync({
        responseId: response.id,
        prompt: continuePrompt.trim(),
      });

      // Step 2: Generate the image and update the response
      await generateFromResponseMutation.mutateAsync({
        responseId: newResponse.id,
        previousImageUrl: response.url,
      });

      // Reset form and refresh data
      setContinuePrompt("");
      setShowContinueForm(false);
      onChainContinued();
    } catch (error) {
      console.error("Failed to continue chain:", error);
      alert("Failed to continue chain. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mb-4 rounded-lg bg-gray-50 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">
              Response #{response.id}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(response.createdAt).toLocaleDateString()}
            </span>
            {response.previousResponseId && (
              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                Chained from #{response.previousResponseId}
              </span>
            )}
          </div>

          <p className="mb-3 text-sm text-gray-700">{response.prompt}</p>

          <img
            src={getImageUrl(response.url)}
            alt={`Response ${response.id}`}
            className="h-auto max-w-full rounded-lg object-cover shadow-sm"
            style={{ maxHeight: "200px" }}
          />
        </div>
      </div>

      {isLast && (
        <div className="mt-3">
          {!showContinueForm ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowContinueForm(true)}
            >
              Continue Chain
            </Button>
          ) : (
            <div className="space-y-3 rounded-lg border bg-white p-3">
              <div>
                <Label htmlFor={`continue-prompt-${response.id}`}>
                  Continue with prompt:
                </Label>
                <Input
                  id={`continue-prompt-${response.id}`}
                  type="text"
                  placeholder="Describe the next transformation..."
                  value={continuePrompt}
                  onChange={(e) => setContinuePrompt(e.target.value)}
                  disabled={isGenerating}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleContinueChain}
                  disabled={!continuePrompt.trim() || isGenerating}
                  size="sm"
                >
                  {isGenerating ? (
                    <>
                      <Loading className="mr-2 h-4 w-4" />
                      Generating...
                    </>
                  ) : (
                    "Generate"
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowContinueForm(false);
                    setContinuePrompt("");
                  }}
                  disabled={isGenerating}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ResponseChainsProps {
  chains: ResponseChain[];
  onChainUpdated?: () => void;
}

export default function ResponseChains({
  chains,
  onChainUpdated,
}: ResponseChainsProps) {
  const handleChainContinued = () => {
    if (onChainUpdated) {
      onChainUpdated();
    }
  };



  // Filter out empty chains and ensure we only show valid chains
  const validChains = chains.filter(chain => chain.length > 0);

  if (validChains.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-8 text-center">
        <p className="text-gray-500">No response chains yet.</p>
        <p className="text-sm text-gray-400">
          Create your first response above to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {validChains.map((chain, chainIndex) => (
        <div
          key={`chain-${chainIndex}`}
          className="border-b border-gray-200 pb-6 last:border-b-0"
        >
          <h4 className="mb-4 text-lg font-medium">
            Chain {chainIndex + 1} ({chain.length} response
            {chain.length !== 1 ? "s" : ""})
          </h4>
          <div className="space-y-3">
            {chain.map((response, responseIndex) => (
              <div key={response.id} className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700">
                  {responseIndex + 1}
                </div>
                <div className="flex-1">
                  <ResponseItem
                    response={response}
                    isLast={responseIndex === chain.length - 1}
                    onChainContinued={handleChainContinued}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
