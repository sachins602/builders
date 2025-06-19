"use client";

import React from "react";
import type { ResponseWithImage } from "~/types/chat";

interface SidebarProps {
  responseHistory: ResponseWithImage[];
  selectedResponseId: number | null;
  onSelectResponse: (id: number) => void;
}

export function Sidebar({
  responseHistory,
  selectedResponseId,
  onSelectResponse,
}: SidebarProps) {
  return (
    <div className="flex h-[535px] w-64 flex-col overflow-y-auto border-r border-gray-700 bg-gray-800">
      <h3 className="sticky top-0 z-10 mb-0 bg-gray-800 p-4 text-sm font-medium text-gray-300">
        Recent Generations
      </h3>
      <div className="flex flex-col gap-2 p-2">
        {responseHistory.map((response) => (
          <button
            key={response.id}
            className={`rounded-md p-2 text-left text-sm text-gray-300 hover:bg-gray-700 ${
              selectedResponseId === response.id ? "bg-gray-700" : ""
            }`}
            onClick={() => onSelectResponse(response.id)}
          >
            <img
              src={response.url}
              alt="Previously generated image"
              className="mb-2 h-auto w-full rounded-md object-cover"
            />
            <span className="line-clamp-2">{response.prompt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
