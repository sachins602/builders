"use client";

import { api } from "~/trpc/react";
import { ZOOM_LIMIT } from "./types";
import { getImageUrl } from "~/lib/image-utils";

interface NearbyResponsesProps {
  currentZoom: number;
  mapCenter: [number, number] | null;
}
export function NearbyResponses({
  currentZoom,
  mapCenter,
}: NearbyResponsesProps) {
  // Fetch nearby shared responses when zoomed to max and map center is available
  const nearbyResponses = api.community.getNearbySharedResponses.useQuery(
    {
      lat: mapCenter?.[0] ?? 0,
      lng: mapCenter?.[1] ?? 0,
      radius: 0.01, // ~1km radius
      limit: 5,
    },
    {
      enabled: currentZoom >= ZOOM_LIMIT && mapCenter !== null,
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  );

  return (
    <div className="h-32">
      {nearbyResponses.data && nearbyResponses.data.length > 0 ? (
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold">Nearby Builds</h3>
          <div className="flex flex-row gap-2 overflow-x-auto">
            {nearbyResponses.data.map((sharedResponse) => (
              <div
                key={sharedResponse.id}
                className="flex cursor-pointer flex-col rounded-xl border transition-colors hover:bg-gray-200"
                onClick={() => {
                  window.location.href = `/build/${sharedResponse.responseId}`;
                }}
              >
                {/* Thumbnail */}
                <img
                  src={getImageUrl(sharedResponse.response.url)}
                  alt="Response thumbnail"
                  className="h-14 w-20 object-cover"
                />

                {/* Content */}
                <div className="flex flex-row gap-2">
                  <div className="text-xs text-gray-500">
                    {sharedResponse.distance}km
                  </div>
                  <div className="text-xs text-gray-400">
                    {sharedResponse._count.likes} likes
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
