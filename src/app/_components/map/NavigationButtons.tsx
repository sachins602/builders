"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { TrendingUp, MapPin, Users } from "lucide-react";
import { api } from "~/trpc/react";
import { ZOOM_LIMIT } from "./types";
import { getImageUrl } from "~/lib/image-utils";

interface NavigationButtonsProps {
  currentZoom: number;
  mapCenter: [number, number] | null;
}

export function NavigationButtons({
  currentZoom,
  mapCenter,
}: NavigationButtonsProps) {
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
    <div className="flex w-full flex-col space-y-2">
      {/* Main Navigation Buttons */}
      <div className="flex w-full flex-row justify-between">
        <Button
          variant="secondary"
          className="m-2 flex h-24 w-32 flex-col p-2"
          onClick={() => {
            window.location.href = "/popular";
          }}
        >
          <TrendingUp className="h-16 w-16 scale-250" />
          <span className="text-lg">Popular</span>
        </Button>

        {/* Nearby Responses Section */}
        {showNearby && (
          <div className="mx-2 rounded-lg border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Nearby Shared Responses</h3>
            </div>

            {nearbyResponses.isLoading ? (
              <div className="text-center text-gray-500">
                Loading nearby responses...
              </div>
            ) : nearbyResponses.error ? (
              <div className="text-center text-red-500">
                Error loading nearby responses
              </div>
            ) : nearbyResponses.data && nearbyResponses.data.length > 0 ? (
              <div className="space-y-3">
                {nearbyResponses.data.slice(0, 3).map((sharedResponse) => (
                  <div
                    key={sharedResponse.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50"
                    onClick={() => {
                      window.location.href = `/create/${sharedResponse.responseId}`;
                    }}
                  >
                    {/* Thumbnail */}
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                      <img
                        src={getImageUrl(sharedResponse.response.url)}
                        alt="Response thumbnail"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {sharedResponse.response.sourceImage?.address ??
                            "Unknown Address"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {sharedResponse.distance}km away
                        </span>
                      </div>
                      <p className="truncate text-sm text-gray-600">
                        {sharedResponse.response.prompt || "No prompt"}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>by {sharedResponse.sharedBy.name}</span>
                        <span>{sharedResponse._count.likes} likes</span>
                        <span>{sharedResponse._count.comments} comments</span>
                      </div>
                    </div>
                  </div>
                ))}

                {nearbyResponses.data.length > 3 && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      window.location.href = "/community";
                    }}
                  >
                    View all {nearbyResponses.data.length} nearby responses
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500">
                No shared responses found nearby
              </div>
            )}
          </div>
        )}

        <Button
          variant="secondary"
          className="m-2 flex h-24 w-32 flex-col p-2"
          onClick={() => {
            window.location.href = "/community";
          }}
        >
          <Users className="h-16 w-16 scale-250" />
          <span className="text-lg">Community</span>
        </Button>
      </div>
    </div>
  );
}
