"use client";
import {
  AdvancedMarker,
  APIProvider,
  InfoWindow,
  Map,
  Marker,
  Pin,
} from "@vis.gl/react-google-maps";
import { env } from "~/env";

export default function WholeMap() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
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
            }}
            disableDefaultUI
          ></Map>
        </APIProvider>
      </div>
    </div>
  );
}
