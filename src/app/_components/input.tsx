"use client";
import React, { useState, useEffect, useRef } from "react";
import { api } from "~/trpc/react";
import { Sidebar } from "./Sidebar";
import { ChatArea } from "./ChatArea";
import { MessageInput } from "./MessageInput";

export type ResponseWithImage = {
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

  const { data: lastImage } = api.response.getLastImage.useQuery();
  const { data: responseHistory, refetch: refetchHistory } = api.response.getResponseHistory.useQuery();

  const generateImageMutation = api.openai.generateImage.useMutation({
    onSuccess: (data) => {
      if (!data.url) console.error("No image URL returned from API");
      setGeneratedImage(data.url);
      setIsGenerating(false);
      setSelectedResponseId(data.id);
      void refetchHistory();
    },
    onError: (error) => {
      setIsGenerating(false);
      console.error("Failed to generate image.", error);
    },
  });

  const continueFromResponseMutation = api.openai.continueFromResponse.useMutation({
    onSuccess: (data) => {
      if (!data.url) console.error("No image URL returned from API");
      setGeneratedImage(data.url);
      setIsGenerating(false);
      setSelectedResponseId(data.id);
      void refetchHistory();
    },
    onError: (error) => {
      setIsGenerating(false);
      console.error("Failed to continue image generation.", error);
    },
  });

  useEffect(() => {
    if (!responseHistory || responseHistory.length === 0) {
      setResponseChain([]);
      return;
    }

    if (selectedResponseId) {
      const selected = responseHistory.find(r => r.id === selectedResponseId);
      if (!selected) {
        setResponseChain([]);
        return;
      }

      const chain: ResponseWithImage[] = [];
      let current = selected as ResponseWithImage;
      // Traverse backwards
      while (current) {
        chain.unshift(current);
        if (!current.previousResponseId) break;
        const prev = responseHistory.find(r => r.id === current.previousResponseId);
        current = prev as ResponseWithImage;
        if (!current) break; // Should not happen if data is consistent
      }
      
      // Traverse forwards from the originally selected response
      // (to include children of the selected node if it wasn't the latest in its own branch)
      let lastInChain = selected as ResponseWithImage;
    
      while (true) {
        const nextInBranch = responseHistory.find(r => r.previousResponseId === lastInChain.id);
        if (nextInBranch && !chain.find(c => c.id === nextInBranch.id)) { // Check if not already in chain
          chain.push(nextInBranch as ResponseWithImage);
          lastInChain = nextInBranch as ResponseWithImage;
        } else {
          break;
        }
      }
      setResponseChain(chain);
    } else {
      setResponseChain([]);
    }
  }, [selectedResponseId, responseHistory]);

  const handleGenerateImage = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);

    if (selectedResponseId) {
      continueFromResponseMutation.mutate({
        prompt,
        previousResponseId: selectedResponseId,
      });
    } else if (lastImage) {
      generateImageMutation.mutate({
        prompt,
        imageUrl: lastImage.url,
        imageId: lastImage.id,
      });
    }
  };

  const handleSelectResponse = (responseId: number) => {
    setSelectedResponseId(responseId);
    const selected = responseHistory?.find(r => r.id === responseId);
    setGeneratedImage(selected?.url ?? null);
  };

  const handleResetSelection = () => {
    setSelectedResponseId(null);
    setGeneratedImage(null);
    setResponseChain([]);
    setPrompt("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [responseChain, generatedImage, isGenerating]);

  if (responseHistory === undefined && lastImage === undefined) {
    return <div className="flex h-full w-full items-center justify-center"><p>Loading chat...</p></div>;
  }

  return (
    <div className="flex h-full w-full">
      <Sidebar 
        responseHistory={responseHistory}
        selectedResponseId={selectedResponseId}
        handleSelectResponse={handleSelectResponse}
      />
      <div className="flex flex-1 flex-col h-[535px]">
        <ChatArea 
          lastImage={lastImage}
          responseChain={responseChain}
          isGenerating={isGenerating}
          generatedImage={generatedImage}
          messagesEndRef={messagesEndRef}
        />
        <MessageInput 
          prompt={prompt}
          setPrompt={setPrompt}
          handleGenerateImage={handleGenerateImage}
          isGenerating={isGenerating}
          selectedResponseId={selectedResponseId}
          lastImage={lastImage}
          responseChain={responseChain}
          handleResetSelection={handleResetSelection}
        />
      </div>
    </div>
  );
}
