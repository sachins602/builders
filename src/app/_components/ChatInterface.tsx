"use client";

import { useChat } from "~/lib/use-chat";
import { ChatArea } from "./chat/ChatArea";
import { MessageInput } from "./chat/MessageInput";
import ResponseAction from "./chat/ResponseAction";
import { api } from "~/trpc/react";

interface ChatInterfaceProps {
  continueFromResponse?: {
    id: number;
    prompt: string;
    url: string;
    sourceImageId: number | null;
  };
}

export function ChatInterface({ continueFromResponse }: ChatInterfaceProps) {
  const { state, chatData, actions, isLoading } = useChat(continueFromResponse);

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
        <p>Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-100px)] w-full flex-col">
      <ChatArea
        lastImage={chatData.lastImage}
        responseChain={state.responseChain}
        isGenerating={state.isGenerating}
      />

      <MessageInput
        prompt={state.prompt}
        onPromptChange={actions.setPrompt}
        onGenerate={actions.generateImage}
        onReset={actions.resetSelection}
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
        onPublish={() => alert("Publish functionality not implemented yet.")}
      />
    </div>
  );
}
