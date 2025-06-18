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

      <div className="flex flex-col gap-3 p-4 pt-0">
        {responseHistory.length > 0 ? (
          responseHistory.slice(0, 10).map((response) => (
            <div
              key={response.id}
              className={`cursor-pointer rounded-lg p-2 transition-all ${
                response.id === selectedResponseId
                  ? "bg-gray-600 ring-1 ring-blue-500"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
              onClick={() => onSelectResponse(response.id)}
            >
              <img
                src={response.url}
                alt="Previous generation"
                className="h-20 w-full rounded-md object-cover"
              />
              <p className="mt-2 line-clamp-2 text-xs text-gray-300">
                {response.proompt}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {new Date(response.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-400">No previous generations</p>
        )}
      </div>
    </div>
  );
}
