"use client";
import React, { useState, useEffect, useRef } from "react";
import { api } from "~/trpc/react";
import { Button } from "./ui/button";
import { Send, Image, Sparkles } from "lucide-react";

type ResponseWithImage = {
  id: number;
  proompt: string;
  url: string;
  createdAt: Date;
  previousResponseId: number | null;
};

export function ProompInput() {
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedResponseId, setSelectedResponseId] = useState<number | null>(null);
  const [responseChain, setResponseChain] = useState<ResponseWithImage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Query for the last image (street view)
  const { data: lastImage } = api.response.getLastImage.useQuery();

  // Query for response history
  const { data: responseHistory, refetch: refetchHistory } = api.response.getResponseHistory.useQuery();

  // Mutation for generating AI image
  const generateImage = api.openai.generateImage.useMutation({
    onSuccess: (data) => {
      if (!data.url) {
        console.error("No image URL returned from API");
      }
      setGeneratedImage(data.url);
      setIsGenerating(false);
      setSelectedResponseId(data.id);
      void refetchHistory();
    },
    onError: (error) => {
      setIsGenerating(false);
      console.error("Failed to generate image. Please try again.", error);
    },
  });

  // Mutation for continuing from a previous response
  const continueFromResponse = api.openai.continueFromResponse.useMutation({
    onSuccess: (data) => {
      if (!data.url) {
        console.error("No image URL returned from API");
      }
      setGeneratedImage(data.url);
      setIsGenerating(false);
      setSelectedResponseId(data.id);
      void refetchHistory();
    },
    onError: (error) => {
      setIsGenerating(false);
      console.error("Failed to generate image. Please try again.", error);
    },
  });

  // Effect to build response chain when a response is selected
  useEffect(() => {
    if (!responseHistory || responseHistory.length === 0) return;
    
    if (selectedResponseId) {
      // Find the selected response
      const selectedResponse = responseHistory.find(r => r.id === selectedResponseId);
      if (!selectedResponse) return;
      
      // Build the chain (both backwards and forwards)
      const chain: ResponseWithImage[] = [];
      
      // Add the current response
      chain.push(selectedResponse as ResponseWithImage);
      
      // Add previous responses (going backwards in the chain)
      let currentResponse = selectedResponse;
      while (currentResponse.previousResponseId) {
        const prevResponse = responseHistory.find(r => r.id === currentResponse.previousResponseId);
        if (!prevResponse) break;
        chain.unshift(prevResponse as ResponseWithImage);
        currentResponse = prevResponse;
      }
      
      // Add next responses (going forwards in the chain)
      let lastResponseId = selectedResponseId;
      let nextResponse = responseHistory.find(r => r.previousResponseId === lastResponseId);
      while (nextResponse) {
        chain.push(nextResponse as ResponseWithImage);
        lastResponseId = nextResponse.id;
        nextResponse = responseHistory.find(r => r.previousResponseId === lastResponseId);
      }
      
      setResponseChain(chain);
    } else {
      setResponseChain([]);
    }
  }, [selectedResponseId, responseHistory]);

  const handleGenerateImage = () => {
    if (!prompt.trim()) {
      console.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);

    // If continuing from a previous response
    if (selectedResponseId) {
      continueFromResponse.mutate({
        prompt,
        previousResponseId: selectedResponseId,
      });
    } 
    // If starting from the original street view image
    else if (lastImage) {
      generateImage.mutate({
        prompt,
        imageUrl: lastImage.url,
        imageId: lastImage.id,
      });
    }
  };

  const handleSelectResponse = (responseId: number) => {
    setSelectedResponseId(responseId);
    setGeneratedImage(responseHistory?.find(r => r.id === responseId)?.url || null);
  };

  const handleResetSelection = () => {
    setSelectedResponseId(null);
    setGeneratedImage(null);
    setResponseChain([]);
  };

  // Scroll to bottom of messages when new content is added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [responseChain, generatedImage]);

  if (!responseHistory) {
    return null;
  }

  return (
    <div className="flex h-full w-full">
      {/* Sidebar */}
      <div className="w-64 flex flex-col border-r border-gray-700 bg-gray-800 h-[535px] overflow-y-auto">
        
          <h3 className="mb-3 text-sm font-medium overflow-y-auto max-h-96 text-gray-300">Recent Generations</h3>
          
          {responseHistory?.length > 0 ? (
            <div className="flex flex-col gap-3">
              {responseHistory.slice(0, 10).map((response) => (
                <div 
                  key={response.id} 
                  className={`cursor-pointer rounded-lg p-2 ${
                    response.id === selectedResponseId 
                      ? 'bg-gray-600 ring-1 ring-blue-500' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  onClick={() => handleSelectResponse(response.id)}
                >
                  <img
                    src={response.url}
                    alt=""
                    className="h-20 w-full rounded-md object-cover"
                  />
                  <p className="mt-2 text-xs text-gray-300 line-clamp-2">{response.proompt}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(response.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">No previous generations</p>
          )}
        
      </div>
      
      {/* Main content */}
      <div className="flex flex-1 flex-col h-[535px]">
        {/* Chat area */}
        <div className="flex-1 overflow-y-auto">
            {/* Reference image */}
            {lastImage && (
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <Image className="h-5 w-5 text-gray-300 mr-2" />
                  <span className="text-sm text-gray-300">Reference Image</span>
                </div>
                <img
                  src={lastImage.url}
                  alt=""
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
                  <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-purple-700">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div className="max-w-3xl rounded-lg bg-gray-800 p-3">
                    
                      <img
                        src={response.url}
                        alt=""
                        className="max-h-64 rounded-md object-cover"
                      />
                    
                  </div>
                </div>
              </div>
            ))}
            {/* Loading indicator */}
            {isGenerating && (
              <div className="mb-4 flex">
                <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-purple-700">
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
            {/* Single generated image */}
            {generatedImage && responseChain.length === 0 && !isGenerating && (
              <div className="mb-4 flex">
                <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-purple-700">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="max-w-3xl">
                  <div className="rounded-lg bg-gray-800 p-3">
                    <img
                      src={generatedImage}
                      alt=""
                      className="max-h-64 rounded-md object-cover"
                    />
                  </div>
                </div>
              </div>
            )}
            {/* Welcome message */}
            {!responseChain.length && !generatedImage && !isGenerating && (
              <div className="mb-4 flex">
                <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-purple-700">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="rounded-lg bg-gray-800 p-3">
                  <p className="text-sm text-gray-300">
                    Welcome to AI Image Chat! Describe how you'd like to transform the image or select a previous generation.
                  </p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
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
                : "Describe how you want to transform the image..."}
              className="min-h-12 w-full resize-none rounded-lg border border-gray-600 bg-gray-700 p-3 pr-12 text-white focus:border-blue-500 focus:outline-none"
              disabled={isGenerating || (!selectedResponseId && !lastImage)}
            />
            <Button
              onClick={handleGenerateImage}
              className="absolute right-2 top-2 p-2"
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
      </div>
    </div>
  );
}
