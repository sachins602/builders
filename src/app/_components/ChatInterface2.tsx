"use client";

import React, { useRef, useEffect } from "react";
import { useChat } from "~/lib/use-chat";
import { Sidebar } from "./chat/Sidebar";
import { ChatArea } from "./chat/ChatArea";
import { MessageInput } from "./chat/MessageInput";
import Image from "next/image";

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
        <div className="flex h-[calc(100vh-100px)] w-full">

            {/* Main Image Div */}
            <div className="flex w-full h-[calc(100vh-400px)] items-center justify-center">
                <Image
                    src={typeof chatData.lastImage === "string" ? chatData.lastImage : "/placeholder-image.png"}
                    alt="Current Image"
                    fill={true}
                    objectFit=""
                    className="rounded-lg shadow-lg"
                />
            </div>


            {/* Suggested Mutations */}

            {/* Popular Mutations */}

            {/* User Input Box */}

            {/* Toolbar: delete, share, publish */}

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