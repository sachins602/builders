"use client";

import { Button } from "./ui/button";
import { ShareDialog } from "./ShareDialog";
import { getImageUrl } from "~/lib/image-utils";
import { Trash2 } from "lucide-react";
import { api } from "~/trpc/react";
import Link from "next/link";
import { Share2 } from "lucide-react";

interface HistoryItemProps {
  response: {
    id: number;
    prompt: string;
    url: string;
  };
}

export function HistoryItem({ response }: HistoryItemProps) {
  const deleteResponse = api.response.deleteResponse.useMutation({
    onSuccess: () => {
      // Refresh the page or update the UI
      window.location.reload();
    },
  });

  const { data: shared } = api.response.getSharedStatusWithId.useQuery({
    id: response.id,
  });

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-white shadow-md transition-shadow duration-300 hover:shadow-lg">
      {shared && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700 shadow">
          <Share2 className="h-4 w-4" /> Shared
        </div>
      )}
      <img
        alt="Generated Art"
        className="h-60 w-full object-cover"
        src={getImageUrl(response.url)}
      />
      <div className="space-y-2 space-x-4 px-2 py-1">
        <h3 className="line-clamp-2 font-medium">{response.prompt}</h3>
        <div className="flex gap-2">
          <ShareDialog responseId={response.id}>
            <Button variant="outline" size="sm">
              Share
            </Button>
          </ShareDialog>
          <Link href={`/create/${response.id}`}>
            <Button variant="outline" size="sm">
              Continue
            </Button>
          </Link>
          <Button
            onClick={() => {
              deleteResponse.mutate({ id: response.id });
            }}
            variant="outline"
            size="sm"
            disabled={deleteResponse.isPending}
          >
            <Trash2 className="m-2 inline-block h-4 w-4" />
            <span>{deleteResponse.isPending ? "Deleting..." : "Delete"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
