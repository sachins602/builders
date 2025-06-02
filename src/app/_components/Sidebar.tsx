"use client";

import React from 'react';
import type { ResponseWithImage } from './input'; // Assuming ResponseWithImage is exported from input.tsx or a types file

interface SidebarProps {
  responseHistory: ResponseWithImage[] | undefined | null;
  selectedResponseId: number | null;
  handleSelectResponse: (id: number) => void;
}

export function Sidebar({ responseHistory, selectedResponseId, handleSelectResponse }: SidebarProps) {
  return (
    <div className="w-64 flex flex-col border-r border-gray-700 bg-gray-800 h-[535px] overflow-y-auto">
      <h3 className="p-4 mb-0 text-sm font-medium text-gray-300 sticky top-0 bg-gray-800 z-10">
        Recent Generations
      </h3>
      <div className="p-4 pt-0 flex flex-col gap-3">
        {responseHistory && responseHistory.length > 0 ? (
          responseHistory.slice(0, 10).map((response) => (
            <div
              key={response.id}
              className={`cursor-pointer rounded-lg p-2 transition-all ${
                response.id === selectedResponseId
                  ? 'bg-gray-600 ring-1 ring-blue-500'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              onClick={() => handleSelectResponse(response.id)}
            >
              <img
                src={response.url}
                alt="Previous generation"
                className="h-20 w-full rounded-md object-cover"
              />
              <p className="mt-2 text-xs text-gray-300 line-clamp-2">
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
