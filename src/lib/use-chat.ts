import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "~/trpc/react";
import type { ChatState, ChatData, ResponseWithImage } from "~/types/chat";

export function useChat() {
  const [state, setState] = useState<ChatState>({
    prompt: "",
    selectedResponseId: null,
    isGenerating: false,
    responseChain: [],
  });

  // API queries - using combined endpoint for better performance
  const { data: apiChatData, refetch: refetchChatData } =
    api.response.getChatData.useQuery();

  // Memoize these to prevent infinite re-renders
  const lastImage = apiChatData?.lastImage ?? null;

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

  // API mutations
  const generateImageMutation = api.openai.generateImage.useMutation({
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
    },
  });

  const continueFromResponseMutation =
    api.openai.continueFromResponse.useMutation({
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
        console.error("Failed to continue image generation:", error);
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
      if (lastImage && responseHistory.length > 0) {
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
        setState((prev) => ({ ...prev, responseChain: [] }));
      }
    }
  }, [
    state.selectedResponseId,
    responseHistory,
    lastImage,
    buildResponseChain,
  ]);

  // Actions
  const generateImage = useCallback(() => {
    if (!state.prompt.trim()) return;

    setState((prev) => ({ ...prev, isGenerating: true }));

    if (state.selectedResponseId) {
      continueFromResponseMutation.mutate({
        prompt: state.prompt,
        previousResponseId: state.selectedResponseId,
      });
    } else if (lastImage) {
      generateImageMutation.mutate({
        prompt: state.prompt,
        imageUrl: lastImage.url,
        imageId: lastImage.id,
      });
    }
  }, [
    state.prompt,
    state.selectedResponseId,
    lastImage,
    continueFromResponseMutation,
    generateImageMutation,
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
