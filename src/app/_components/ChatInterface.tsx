"use client";

import React, { useRef, useEffect } from "react";
import { useChat } from "~/lib/use-chat";
import { Sidebar } from "./chat/Sidebar";
import { ChatArea } from "./chat/ChatArea";
import { MessageInput } from "./chat/MessageInput";

export function ChatInterface() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { state, chatData, actions, isLoading } = useChat();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.responseChain, state.isGenerating]);

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
        messagesEndRef={messagesEndRef}
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
    </div>
  );
}
