"use client";

import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
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
  const [showNearby, setShowNearby] = useState(false);

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

  // Show nearby responses when zoomed to max
  useEffect(() => {
    setShowNearby(currentZoom >= ZOOM_LIMIT);
  }, [currentZoom]);
  return (
    <div className="h-32 max-h-32">
      {showNearby && (
        <div className="mx-2 rounded-lg border bg-white shadow-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold">Nearby Responses</h3>
          </div>

          {nearbyResponses.isLoading ? (
            <div className="text-center text-xs text-gray-500">Loading...</div>
          ) : nearbyResponses.error ? (
            <div className="text-center text-xs text-red-500">
              Error loading
            </div>
          ) : nearbyResponses.data && nearbyResponses.data.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {nearbyResponses.data.map((sharedResponse) => (
                <div
                  key={sharedResponse.id}
                  className="flex-shrink-0 cursor-pointer rounded-lg border bg-gray-50 p-2 transition-colors hover:bg-gray-200"
                  onClick={() => {
                    window.location.href = `/community/${sharedResponse.id}`;
                  }}
                >
                  {/* Thumbnail */}
                  <img
                    src={getImageUrl(sharedResponse.response.url)}
                    alt="Response thumbnail"
                    className="h-14 w-full object-cover"
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
          ) : (
            <div className="text-center text-xs text-gray-500">
              No nearby responses
            </div>
          )}
        </div>
      )}
    </div>
  );
}
