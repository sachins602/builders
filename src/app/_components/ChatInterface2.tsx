"use client";

// React core imports
import React, { useRef, useEffect } from "react";

// Hooks
import { useChat } from "~/lib/use-chat";

// Components
import { MessageInput2 } from "./chat/MessageInput2";



// Icon components
import { ArrowLeft, ArrowRight, Rocket, Share, Trash2 } from "lucide-react";
import { getImageUrl } from "~/lib/image-utils";

export function ChatInterface2() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { state, chatData, actions, isLoading } = useChat();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.responseChain, state.isGenerating]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p>Loading building mutator...</p>
      </div>
    );
  }

  // General page layout: singular column, no sidebar:
  //      [image we're working with with arrows on either side to change to next/previous image]
  //      [suggested mutations]
  //      [popular mutations]
  //      [user input box]
  //      [toolbar: delete, share, publish]

  return (
    <div className="flex h-full w-full flex-col">
      {/* Main Image Div */}

      <div className="relative flex w-full flex-grow-1 flex-row items-center justify-center">
        {/* Left Arrow */}
        <button
          className="absolute left-0 z-10 m-2 rounded-full bg-gray-200 p-2 transition-colors hover:bg-gray-300"
          onClick={() => actions.selectResponse(0)}
        >
          <ArrowLeft className="h-6 w-6 text-gray-700" />
        </button>

        {/*Image Container*/}
        <div>
          <img
            src={getImageUrl(chatData.lastImage?.url ?? "")}
            alt="Current Image"
            className="h-96 w-full rounded-lg shadow-lg"
          />
        </div>

        {/* Right Arrow */}
        <button
          className="absolute right-0 z-10 m-2 rounded-full bg-gray-200 p-2 transition-colors hover:bg-gray-300"
          onClick={() =>
            actions.selectResponse(chatData.responseHistory.length - 1)
          }
        >
          <ArrowRight className="h-6 w-6 text-gray-700" />
        </button>
      </div>

      {/* User Input Box */}

      <MessageInput2
        prompt={state.prompt}
        onPromptChange={actions.setPrompt}
        onGenerate={actions.generateImage}
        onReset={actions.resetSelection}
        isGenerating={state.isGenerating}
        canGenerate={!!(state.selectedResponseId ?? chatData.lastImage)}
        hasActiveConversation={state.responseChain.length > 0}
      />

      {/* Toolbar: delete, share, publish */}

      <div className="flex justify-between border-t bg-gray-100 p-4">
        <button
          className="flex flex-col items-center rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          onClick={actions.resetSelection}
        >
          <Trash2 className="m-2 inline-block h-4 w-4" />
          <span>Delete</span>
        </button>
        <button
          className="flex flex-col items-center rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          onClick={() => alert("Share functionality not implemented yet.")}
        >
          <Share className="m-2 inline-block h-4 w-4" />
          <span>Share</span>
        </button>
        <button
          className="flex flex-col items-center rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
          onClick={() => alert("Publish functionality not implemented yet.")}
        >
          <Rocket className="m-2 inline-block h-4 w-4" />
          <span>Publish</span>
        </button>
      </div>
    </div>
  );
  /*
      return (
        <div className="flex h-[calc(100vh-100px)] w-full">
          <Sidebar
            responseHistory={chatData.responseHistory}
            selectedResponseId={state.selectedResponseId}
            onSelectResponse={actions.selectResponse}
          />
    
          <div className="flex w-full flex-col">
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
        </div>
      );*/
}
