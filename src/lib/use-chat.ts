import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "~/trpc/react";
import type { ChatState, ChatData, ResponseWithImage } from "~/types/chat";

type UseChatOptions = {
  continueFromResponseId?: number;
  sourceImageId?: number;
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
  };
};

export function useChat(options?: UseChatOptions) {
  const continueFromResponseId = options?.continueFromResponseId;
  const sourceImageId = options?.sourceImageId;
  const sourceImage = options?.sourceImage;

  const [state, setState] = useState<ChatState>({
    prompt: "",
    selectedResponseId: continueFromResponseId ?? null,
    isGenerating: false,
    responseChain: [],
  });

  // Primary chat data (user's last image and history)
  const {
    data: apiChatData,
    refetch: refetchChatData,
    isLoading: isChatLoading,
  } = api.response.getChatData.useQuery();

  // Base data from server
  const baseLastImage = apiChatData?.lastImage ?? null;
  const responseHistory = useMemo(
    () => apiChatData?.responseHistory ?? [],
    [apiChatData?.responseHistory],
  );

  // Determine the current image context for chains
  const currentImageId = useMemo(() => {
    if (sourceImageId) return sourceImageId;
    if (continueFromResponseId) {
      const r = responseHistory.find((x) => x.id === continueFromResponseId);
      if (r?.sourceImageId) return r.sourceImageId;
    }
    if (state.selectedResponseId) {
      const r = responseHistory.find((x) => x.id === state.selectedResponseId);
      if (r?.sourceImageId) return r.sourceImageId;
    }
    return baseLastImage?.id ?? null;
  }, [
    sourceImageId,
    continueFromResponseId,
    state.selectedResponseId,
    responseHistory,
    baseLastImage,
  ]);

  // Fetch all chains for the current image (server computes order/links)
  const {
    data: chainsForImage,
    refetch: refetchChains,
    isLoading: isChainsLoading,
  } = api.response.getResponseChainsByImageId.useQuery(
    { imageId: currentImageId! },
    { enabled: !!currentImageId },
  );

  // Resolve the root image of the current context
  const historyRootImage = useMemo(() => {
    if (!currentImageId) return null;
    const withRoot = responseHistory.find(
      (r) => r.sourceImageId === currentImageId && r.sourceImage,
    );
    return withRoot?.sourceImage ?? null;
  }, [currentImageId, responseHistory]);

  const shouldFetchImageById = useMemo(() => {
    if (!currentImageId) return false;
    if (sourceImage && sourceImage.id === currentImageId) return false;
    if (baseLastImage && baseLastImage.id === currentImageId) return false;
    if (historyRootImage && historyRootImage.id === currentImageId)
      return false;
    return true;
  }, [currentImageId, sourceImage, baseLastImage, historyRootImage]);

  const { data: fetchedRootImage } = api.response.getImageById.useQuery(
    { id: currentImageId! },
    { enabled: shouldFetchImageById },
  );

  // Resolve the actual root image for the current context (used by UI and generation)
  const rootImage = useMemo(() => {
    if (sourceImage && (!currentImageId || sourceImage.id === currentImageId)) {
      return sourceImage;
    }
    if (currentImageId) {
      if (baseLastImage && baseLastImage.id === currentImageId)
        return baseLastImage;
      if (historyRootImage && historyRootImage.id === currentImageId)
        return historyRootImage;
      if (fetchedRootImage && fetchedRootImage.id === currentImageId)
        return fetchedRootImage;
    }
    return sourceImage ?? baseLastImage;
  }, [
    sourceImage,
    currentImageId,
    baseLastImage,
    historyRootImage,
    fetchedRootImage,
  ]);

  // Keep responseChain and selectedResponseId in sync with server-provided chains
  useEffect(() => {
    if (!chainsForImage || chainsForImage.length === 0) {
      setState((prev) => ({ ...prev, responseChain: [] }));
      return;
    }

    const findChainContaining = (id: number) =>
      chainsForImage.find((chain) => chain.some((r) => r.id === id)) ?? null;

    const preferredId =
      state.selectedResponseId ?? continueFromResponseId ?? null;
    let chain: ResponseWithImage[] | null = null;

    if (preferredId) {
      chain = findChainContaining(preferredId);
    }

    // Default to the latest chain (router orders by createdAt asc)
    chain ??= chainsForImage[chainsForImage.length - 1] ?? null;

    const selectedId =
      preferredId && chain?.some((r) => r.id === preferredId)
        ? preferredId
        : chain && chain.length > 0
          ? chain[chain.length - 1]!.id
          : null;

    setState((prev) => ({
      ...prev,
      responseChain: chain ?? [],
      selectedResponseId: selectedId,
    }));
  }, [chainsForImage, continueFromResponseId, state.selectedResponseId]);

  // Mutations
  const createNewChainMutation =
    api.response.createNewChainFromImage.useMutation({
      onSuccess: (newResponse) => {
        // Resolve source image URL for initial generation
        const imageUrl = rootImage?.url ?? null;

        if (!imageUrl) {
          setState((prev) => ({ ...prev, isGenerating: false }));
          console.error("No image URL available for generation");
          alert("No image URL available for generation. Please try again.");
          return;
        }

        generateFromImageMutation.mutate({
          responseId: newResponse.id,
          imageUrl,
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
      void refetchChains();
    },
    onError: (error) => {
      setState((prev) => ({ ...prev, isGenerating: false }));
      console.error("Failed to generate image:", error);
      alert("Failed to generate image. Please try again.");
    },
  });

  const continueChainFromResponseMutation =
    api.response.continueChainFromResponse.useMutation({
      onSuccess: (newResponse) => {
        // Determine the previous image URL from current chain or history
        const prevUrl = (() => {
          const fromChain = state.responseChain.find(
            (r) => r.id === state.selectedResponseId,
          )?.url;
          if (fromChain) return fromChain;
          return (
            responseHistory.find((r) => r.id === state.selectedResponseId)
              ?.url ?? null
          );
        })();

        if (!prevUrl) {
          setState((prev) => ({ ...prev, isGenerating: false }));
          console.error("No selected response URL available for continuation");
          alert("Failed to continue chain: No previous response found.");
          return;
        }

        generateFromResponseMutation.mutate({
          responseId: newResponse.id,
          previousImageUrl: prevUrl,
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
        void refetchChains();
      },
      onError: (error) => {
        setState((prev) => ({ ...prev, isGenerating: false }));
        console.error("Failed to generate image:", error);
        alert("Failed to generate image. Please try again.");
      },
    });

  // Actions
  const generateImage = useCallback(() => {
    if (!state.prompt.trim()) return;

    setState((prev) => ({ ...prev, isGenerating: true }));

    if (state.selectedResponseId) {
      // Continue within the same chain
      continueChainFromResponseMutation.mutate({
        responseId: state.selectedResponseId,
        prompt: state.prompt,
      });
    } else if (currentImageId) {
      // Start a new chain from the current image
      createNewChainMutation.mutate({
        imageId: currentImageId,
        prompt: state.prompt,
      });
    } else {
      // No image context available
      setState((prev) => ({ ...prev, isGenerating: false }));
      alert("No image selected. Please choose an image first.");
    }
  }, [
    state.prompt,
    state.selectedResponseId,
    currentImageId,
    continueChainFromResponseMutation,
    createNewChainMutation,
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

  // Reset to start fresh when a specific source image is provided (remix)
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

  const chatData: ChatData = useMemo(
    () => ({ lastImage: rootImage ?? null, responseHistory }),
    [rootImage, responseHistory],
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
    isLoading: isChatLoading || (!!currentImageId && isChainsLoading),
  };
}
