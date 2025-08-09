"use client";
import { useChat } from "~/lib/use-chat";
import { ChatArea } from "./chat/ChatArea";
import { MessageInput } from "./chat/MessageInput";
import ResponseAction from "./chat/ResponseAction";
import { api } from "~/trpc/react";
import { Loading } from "./ui/loading";

interface ChatInterfaceProps {
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
}

export function ChatInterface({
  continueFromResponseId,
  sourceImageId,
  sourceImage,
}: ChatInterfaceProps) {
  const { state, chatData, actions, isLoading } = useChat({
    continueFromResponseId,
    sourceImageId,
    sourceImage,
  });

  const { mutate: deleteResponse } = api.response.deleteResponse.useMutation({
    onSuccess: () => {
      window.location.reload();
    },
    onError: (error) => {
      console.error(error);
      alert("Failed to delete response, please try again.");
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-100px)] min-h-0 w-full flex-col">
      <ChatArea
        lastImage={chatData.lastImage}
        responseChain={state.responseChain}
        isGenerating={state.isGenerating}
      />
      <MessageInput
        prompt={state.prompt}
        onPromptChange={actions.setPrompt}
        onGenerate={actions.generateImage}
        isGenerating={state.isGenerating}
        canGenerate={!!(state.selectedResponseId ?? chatData.lastImage)}
        hasActiveConversation={state.responseChain.length > 0}
      />
      <ResponseAction
        onDelete={() => {
          if (state.selectedResponseId) {
            deleteResponse({ id: state.selectedResponseId });
          }
        }}
        canGenerate={!!(state.selectedResponseId ?? chatData.lastImage)}
        isGenerating={state.isGenerating}
        responseId={state.selectedResponseId ?? null}
      />
    </div>
  );
}
