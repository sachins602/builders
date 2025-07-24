"use client";

import { Button } from "./ui/button";
import { ShareDialog } from "./ShareDialog";
import { getImageUrl } from "~/lib/image-utils";
import { Trash2, Share2, ArrowRight } from "lucide-react";
import { api } from "~/trpc/react";
import Link from "next/link";
import type { ResponseWithImage } from "~/types/chat";

export function HistoryItem({ response }: { response: ResponseWithImage }) {
  const deleteResponse = api.response.deleteResponse.useMutation({
    onSuccess: () => {
      // Refresh the page or update the UI
      window.location.reload();
    },
  });

  const { data: shared, isLoading: isSharedLoading } =
    api.response.getSharedStatusWithId.useQuery({
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
        <h3 className="line-clamp-2 font-normal">
          {response.sourceImage?.address ?? "No address available"}
        </h3>
        <div className="flex gap-2">
          {!isSharedLoading && !shared && (
            <ShareDialog responseId={response.id}>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4" /> Share
              </Button>
            </ShareDialog>
          )}
          <Link href={`/create/${response.id}`}>
            <Button variant="outline" size="sm">
              <ArrowRight className="h-4 w-4" /> Continue
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
            <Trash2 className="inline-block h-4 w-4" />
            <span>{deleteResponse.isPending ? "Deleting..." : "Delete"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
