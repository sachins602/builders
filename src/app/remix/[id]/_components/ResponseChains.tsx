"use client";

import { getImageUrl } from "~/lib/image-utils";
import Link from "next/link";
import { Button } from "~/app/_components/ui/button";

type ResponseData = {
  id: number;
  prompt: string;
  url: string;
  createdAt: Date;
  previousResponseId: number | null;
};

type ResponseChain = ResponseData[];

interface ResponseChainsProps {
  chains: ResponseChain[];
}

interface ResponseItemProps {
  response: ResponseData;
  isLast: boolean;
}

function ResponseItem({ response, isLast }: ResponseItemProps) {
  return (
    <div className="mb-4 rounded-lg bg-gray-50 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">
              Response #{response.id}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(response.createdAt).toLocaleDateString()}
            </span>
            {response.previousResponseId && (
              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                Chained from #{response.previousResponseId}
              </span>
            )}
          </div>

          <p className="mb-3 text-sm text-gray-700">{response.prompt}</p>

          <img
            src={getImageUrl(response.url)}
            alt={`Response ${response.id}`}
            className="h-auto max-w-full rounded-lg shadow-sm"
            style={{ maxHeight: "200px" }}
          />
        </div>
      </div>

      {isLast && (
        <div className="mt-3 flex gap-2">
          <Link href={`/create/${response.id}`}>
            <Button variant="outline" size="sm">
              Continue Chain
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ResponseChains({ chains }: ResponseChainsProps) {
  if (chains.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-8 text-center">
        <p className="text-gray-500">No response chains yet.</p>
        <p className="text-sm text-gray-400">
          Create your first response above to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {chains.map((chain, chainIndex) => (
        <div
          key={`chain-${chainIndex}`}
          className="border-b border-gray-200 pb-6 last:border-b-0"
        >
          <h4 className="mb-4 text-lg font-medium">
            Chain {chainIndex + 1} ({chain.length} response
            {chain.length !== 1 ? "s" : ""})
          </h4>
          <div className="space-y-3">
            {chain.map((response, responseIndex) => (
              <div key={response.id} className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700">
                  {responseIndex + 1}
                </div>
                <div className="flex-1">
                  <ResponseItem
                    response={response}
                    isLast={responseIndex === chain.length - 1}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
