"use client";
import { APIProvider, InfoWindow, Map } from "@vis.gl/react-google-maps";
import { useState } from "react";
import { env } from "~/env";
import { api } from "~/trpc/react";
import {
  CircleArrowDown,
  CircleArrowLeft,
  CircleArrowRight,
  CircleArrowUp,
} from "lucide-react";

export default function WholeMap() {
  const [position, setPosition] = useState<google.maps.LatLngLiteral | null>(
    null,
  );
  const image = api.post.saveStreetViewImage.useMutation({
    onSuccess: (data) => {
      console.log(typeof data);
      if (data instanceof Error) {
        console.error("Error fetching image", data);
        return;
      }
    },
  });

  return (
    <div className="flex flex-col items-center justify-center text-white">
      <h1 className="text-2xl text-white">Map</h1>
      <div className="h-[500px] w-full">
        <APIProvider
          apiKey={env.NEXT_PUBLIC_GOOGLE_API_KEY}
          libraries={["marker"]}
        >
          <Map
            mapId={"bf51a910020fa25a"}
            defaultZoom={12}
            defaultCenter={{ lat: 43.6784979, lng: -79.3452789 }}
            gestureHandling={"greedy"}
            onClick={(e) => {
              console.log("Map clicked", e.detail);
              setPosition({
                lat: e.detail.latLng?.lat ?? 0,
                lng: e.detail.latLng?.lng ?? 0,
              });
            }}
            disableDefaultUI
          >
            {position && (
              <InfoWindow
                position={{ lat: position.lat, lng: position.lng }}
                maxWidth={200}
              >
                <div className="flex flex-col bg-gray-800 text-white">
                  <p>Choose an angle</p>
                  <div className="text-cente grid grid-cols-3 grid-rows-3 items-center justify-center justify-items-center gap-1 p-1">
                    <div className="h-6 w-6" />
                    <button
                      className="h-6 w-6 hover:scale-110 hover:bg-gray-600"
                      onClick={() => console.log("clicked 1")}
                    >
                      <CircleArrowUp />
                    </button>
                    <div className="h-6 w-6" />
                    <button
                      className="h-6 w-6 hover:scale-110 hover:bg-gray-600"
                      onClick={() => console.log("clicked 2")}
                    >
                      <CircleArrowLeft />
                    </button>
                    <div className="h-6 w-6" />
                    <button
                      className="h-6 w-6 hover:scale-110 hover:bg-gray-600"
                      onClick={() => {
                        image.mutate(
                          {
                            lat: position.lat ?? 0,
                            lng: position.lng ?? 0,
                            heading: 90,
                          },
                          {
                            onSuccess: (data) => {
                              console.log("Image saved successfully", data);
                              window.location.href = "/create";
                            },
                            onError: (error) => {
                              console.error("Error saving image", error);
                            },
                          },
                        );
                      }}
                    >
                      <CircleArrowRight />
                    </button>
                    <div className="h-6 w-6" />
                    <button
                      className="h-6 w-6 hover:scale-110 hover:bg-gray-600"
                      onClick={() => console.log("clicked 4")}
                    >
                      <CircleArrowDown />
                    </button>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>
    </div>
  );
}
