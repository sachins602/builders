"use client";

import React from "react";
import type { ResponseWithImage } from "~/types/chat";
import { getImageUrl } from "~/lib/image-utils";

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
    <aside className="flex h-full w-80 flex-col border-r bg-gray-50">
      <div className="flex-shrink-0 p-4">
        <h3 className="text-lg font-semibold text-gray-800">History</h3>
        <p className="text-sm text-gray-500">Previously generated images</p>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {responseHistory.map((response) => (
          <button
            key={response.id}
            className={`w-full rounded-lg p-2 text-left ${
              selectedResponseId === response.id
                ? "bg-blue-100"
                : "hover:bg-gray-100"
            }`}
            onClick={() => onSelectResponse(response.id)}
          >
            <img
              src={getImageUrl(response.url)}
              alt="Previously generated image"
              className="mb-2 w-full rounded-md object-cover"
            />
            <span className="line-clamp-2 text-sm text-gray-700">
              {response.prompt}
            </span>
          </button>
        ))}
        {responseHistory.length === 0 && (
          <p className="p-4 text-sm text-gray-500">
            No history yet. Start by generating an image!
          </p>
        )}
      </div>
    </aside>
  );
}
