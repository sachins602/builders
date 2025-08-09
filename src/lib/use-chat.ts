import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "~/trpc/react";
import type { ChatState, ChatData, ResponseWithImage } from "~/types/chat";

export function useChat(
  continueFromResponse?: {
    id: number;
    prompt: string;
    url: string;
    sourceImageId?: number | null;
  },
  sourceImageId?: number,
  sourceImage?: {
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
  },
) {
  const [state, setState] = useState<ChatState>({
    prompt: "",
    selectedResponseId: continueFromResponse?.id ?? null,
    isGenerating: false,
    responseChain: [],
  });

  // API queries - using combined endpoint for better performance
  const { data: apiChatData, refetch: refetchChatData } =
    api.response.getChatData.useQuery();

  // Memoize these to prevent infinite re-renders
  const lastImage = sourceImage ?? apiChatData?.lastImage ?? null;

  const responseHistory = useMemo(
    () => apiChatData?.responseHistory ?? [],
    [apiChatData?.responseHistory],
  );

  // Helper function to build response chain
  const buildResponseChain = useCallback(
    (selected: ResponseWithImage, history: ResponseWithImage[]) => {
      const chain: ResponseWithImage[] = [];
      let current = selected;

      // Traverse backwards to build chain
      while (current) {
        chain.unshift(current);
        if (!current.previousResponseId) break;
        const prev = history.find((r) => r.id === current.previousResponseId);
        if (!prev) break;
        current = prev;
      }

      // Traverse forwards from selected response
      let lastInChain = selected;
      while (true) {
        const nextInBranch = history.find(
          (r) => r.previousResponseId === lastInChain.id,
        );
        if (nextInBranch && !chain.find((c) => c.id === nextInBranch.id)) {
          chain.push(nextInBranch);
          lastInChain = nextInBranch;
        } else {
          break;
        }
      }

      return chain;
    },
    [],
  );

  // Removed legacy mutations; use unified two-step flow below

  // New simplified mutations for remix flow
  const createNewChainMutation =
    api.response.createNewChainFromImage.useMutation({
      onSuccess: (newResponse) => {
        // After creating the response record, generate the image
        // Use sourceImage URL when available, otherwise fallback to lastImage
        const imageUrl = sourceImage?.url ?? lastImage?.url;
        if (!imageUrl) {
          setState((prev) => ({ ...prev, isGenerating: false }));
          console.error("No image URL available for generation");
          alert("No image URL available for generation. Please try again.");
          return;
        }

        generateFromImageMutation.mutate({
          responseId: newResponse.id,
          imageUrl: imageUrl,
        });
      },
      onError: (error) => {
        setState((prev) => ({ ...prev, isGenerating: false }));
        console.error("Failed to create new chain:", error);
        alert("Failed to create new chain. Please try again.");
      },
    });

  const generateFromImageMutation = api.openai.generateFromImage.useMutation({
    onSuccess: (data) => {
      setState((prev) => ({
        ...prev,
        isGenerating: false,
        selectedResponseId: data.id,
      }));
      void refetchChatData();
    },
    onError: (error) => {
      setState((prev) => ({ ...prev, isGenerating: false }));
      console.error("Failed to generate image:", error);
      alert("Failed to generate image. Please try again.");
      // Note: The database record created by createNewChainMutation
      // will remain with an empty URL, but this is acceptable as it represents
      // a failed generation attempt that can be cleaned up later if needed.
    },
  });

  // New simplified mutations for continuing chains
  const continueChainFromResponseMutation =
    api.response.continueChainFromResponse.useMutation({
      onSuccess: (newResponse) => {
        // After creating the response record, generate the image
        // Use the selected response's URL as the previous image URL for chain continuation
        const selectedResponse = responseHistory.find(
          (r) => r.id === state.selectedResponseId,
        );

        if (!selectedResponse?.url) {
          setState((prev) => ({ ...prev, isGenerating: false }));
          console.error(
            "No selected response URL available for chain continuation",
          );
          alert("Failed to continue chain: No previous response found.");
          return;
        }

        generateFromResponseMutation.mutate({
          responseId: newResponse.id,
          previousImageUrl: selectedResponse.url,
        });
      },
      onError: (error) => {
        setState((prev) => ({ ...prev, isGenerating: false }));
        console.error("Failed to continue chain:", error);
        alert("Failed to continue chain. Please try again.");
      },
    });

  const generateFromResponseMutation =
    api.openai.generateFromResponse.useMutation({
      onSuccess: (data) => {
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          selectedResponseId: data.id,
        }));
        void refetchChatData();
      },
      onError: (error) => {
        setState((prev) => ({ ...prev, isGenerating: false }));
        console.error("Failed to generate image:", error);
        alert("Failed to generate image. Please try again.");
        // Note: The database record created by continueChainFromResponseMutation
        // will remain with an empty URL, but this is acceptable as it represents
        // a failed generation attempt that can be cleaned up later if needed.
      },
    });

  // Build response chain when selection changes OR when data loads
  useEffect(() => {
    if (responseHistory.length === 0) {
      setState((prev) => ({ ...prev, responseChain: [] }));
      return;
    }

    if (state.selectedResponseId) {
      const selected = responseHistory.find(
        (r) => r.id === state.selectedResponseId,
      );
      if (!selected) {
        setState((prev) => ({ ...prev, responseChain: [] }));
        return;
      }

      const chain = buildResponseChain(selected, responseHistory);
      setState((prev) => ({ ...prev, responseChain: chain }));
    } else {
      // If no response is selected but we have a last image,
      // automatically show any responses associated with that image
      // BUT only if we're not starting a new chain (sourceImageId provided)
      if (lastImage && responseHistory.length > 0 && !sourceImageId) {
        // Find responses that were generated from the last image
        const responsesForLastImage = responseHistory.filter(
          (response) => response.sourceImageId === lastImage.id,
        );

        if (responsesForLastImage.length > 0) {
          // Find the latest response chain for this image
          // Look for the most recent response that doesn't have a next response
          const latestResponse = responsesForLastImage
            .filter((response) => {
              // Find responses that are not referenced by other responses as previousResponseId
              return !responsesForLastImage.some(
                (r) => r.previousResponseId === response.id,
              );
            })
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )[0];

          if (latestResponse) {
            // Build the chain for this latest response
            const chain = buildResponseChain(latestResponse, responseHistory);
            setState((prev) => ({
              ...prev,
              responseChain: chain,
              selectedResponseId: latestResponse.id,
            }));
          }
        } else {
          setState((prev) => ({ ...prev, responseChain: [] }));
        }
      } else {
        // When sourceImageId is provided (from remix page), start with empty chain
        setState((prev) => ({ ...prev, responseChain: [] }));
      }
    }
  }, [
    state.selectedResponseId,
    responseHistory,
    lastImage,
    sourceImageId,
    buildResponseChain,
  ]);

  // Actions
  const generateImage = useCallback(() => {
    if (!state.prompt.trim()) return;

    setState((prev) => ({ ...prev, isGenerating: true }));

    // When sourceImageId is provided (from remix page), use new simplified flow for ALL cases
    if (sourceImageId) {
      if (state.selectedResponseId) {
        // Continue chain using new simplified flow
        continueChainFromResponseMutation.mutate({
          responseId: state.selectedResponseId,
          prompt: state.prompt,
        });
      } else {
        // Start new chain using new simplified flow
        createNewChainMutation.mutate({
          imageId: sourceImageId,
          prompt: state.prompt,
        });
      }
    } else {
      // Use new two-step flow for regular create page as well
      if (state.selectedResponseId) {
        // Continue chain within the same chain
        continueChainFromResponseMutation.mutate({
          responseId: state.selectedResponseId,
          prompt: state.prompt,
        });
      } else if (lastImage) {
        // Start a new chain from the latest image
        createNewChainMutation.mutate({
          imageId: lastImage.id,
          prompt: state.prompt,
        });
      }
    }
  }, [
    state.prompt,
    state.selectedResponseId,
    lastImage,
    sourceImageId,
    // removed legacy mutations
    createNewChainMutation,
    continueChainFromResponseMutation,
    generateFromResponseMutation,
  ]);

  const selectResponse = useCallback((responseId: number) => {
    setState((prev) => ({ ...prev, selectedResponseId: responseId }));
  }, []);

  const resetSelection = useCallback(() => {
    setState({
      prompt: "",
      selectedResponseId: null,
      isGenerating: false,
      responseChain: [],
    });
  }, []);

  // Reset to start fresh when sourceImageId is provided (new chain)
  useEffect(() => {
    if (sourceImageId) {
      setState({
        prompt: "",
        selectedResponseId: null,
        isGenerating: false,
        responseChain: [],
      });
    }
  }, [sourceImageId]);

  const setPrompt = useCallback((prompt: string) => {
    setState((prev) => ({ ...prev, prompt }));
  }, []);

  // Memoize chatData to prevent unnecessary re-renders
  const chatData: ChatData = useMemo(
    () => ({
      lastImage,
      responseHistory,
    }),
    [lastImage, responseHistory],
  );

  return {
    state,
    chatData,
    actions: {
      generateImage,
      selectResponse,
      resetSelection,
      setPrompt,
    },
    isLoading: apiChatData === undefined,
  };
}
