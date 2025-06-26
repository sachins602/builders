import {
  MapContainer,
  Polygon,
  TileLayer,
  GeoJSON,
  useMapEvents,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type L from "leaflet";
import type { LeafletMouseEvent } from "leaflet";
import TorontoTopoJSON from "public/toronto_crs84.json";
import { useState } from "react";

import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Search, Hammer, Edit } from "lucide-react";
import { torontoBoundary } from "./torontoBoundary";
import { env } from "~/env";
import { Skeleton } from "../ui/skeleton";
import { api } from "~/trpc/react";

const outerBounds: [number, number][][] = [
  [
    [90, -180],
    [90, 180],
    [-90, 180],
    [-90, -180],
  ],
];

const maskPolygon: [number, number][][] = [...outerBounds, torontoBoundary];

export default function MapComponent() {
  const [currentZoom, setCurrentZoom] = useState(11);
  const [clickedPosition, setClickedPosition] = useState<
    [number, number] | null
  >(null);

  const utils = api.useUtils();

  const parcelData = api.response.getEnhancedParcelData.useQuery();

  const image = api.response.saveStreetViewImageAddress.useMutation({
    onSuccess: () => {
      // Invalidate the getChatData query to refresh the last image and responses
      void utils.response.getChatData.invalidate();
    },
    onError: (error) => {
      console.error("Error fetching image:", error);
      // Consider adding a toast notification here for better user feedback
    },
  });

  const nearbyImages = api.response.getNearbyImages.useMutation({
    onError: (error) => {
      console.error("Error fetching image:", error);
      // Consider adding a toast notification here for better user feedback
    },
  });

  function MapEvents() {
    const map = useMapEvents({
      click(e) {
        if (map.getZoom() < 18) {
          map.flyTo(e.latlng, map.getZoom() + 1);
        } else {
          setClickedPosition([e.latlng.lat, e.latlng.lng]);
          image.mutate({
            lat: e.latlng.lat,
            lng: e.latlng.lng,
          });
          nearbyImages.mutate({
            lat: e.latlng.lat,
            lng: e.latlng.lng,
          });
        }
      },
      moveend() {
        setCurrentZoom(map.getZoom());
        if (map.getZoom() < 18) {
          setClickedPosition(null);
        }
      },
    });
    return null;
  }

  return (
    <div className="flex h-[calc(100vh-100px)] w-full flex-col space-y-2">
      <div className="h-full w-full">
        <MapContainer
          center={[43.7, -79.42]} // Toronto coordinates
          zoom={11}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url={`https://api.maptiler.com/maps/toner/{z}/{x}/{y}.png?key=${env.NEXT_PUBLIC_MAPTILER_KEY}`}
            attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          <GeoJSON
            data={TorontoTopoJSON as GeoJSON.GeoJsonObject}
            style={() => ({
              color: "black",
              weight: 2,
              opacity: 1,
              fillOpacity: 0,
              hover: {
                color: "blue",
                weight: 3,
                fillOpacity: 0.5,
              },
            })}
          />

          <Polygon
            positions={maskPolygon}
            pathOptions={{
              color: "black",
              weight: 2,
              fillColor: "white",
              opacity: 1,
              fillOpacity: 1,
            }}
          />

          {parcelData.data?.map((parcel) => {
            // If we have actual property boundary data, render it as a polygon
            if (
              parcel.propertyBoundary?.coordinates &&
              Array.isArray(parcel.propertyBoundary.coordinates[0])
            ) {
              const coordinates = (
                parcel.propertyBoundary.coordinates[0] as [number, number][]
              ).map(([lng, lat]) => [lat, lng] as [number, number]);

              return (
                <Polygon
                  key={parcel.id}
                  positions={coordinates}
                  eventHandlers={{
                    click: () => {
                      console.log(`Property clicked: ${parcel.address}`);
                      console.log(`Building type: ${parcel.buildingType}`);
                      if (parcel.buildingArea) {
                        console.log(
                          `Building area: ${Math.round(
                            parcel.buildingArea,
                          )} m²`,
                        );
                      }
                    },
                    mouseover: (e: LeafletMouseEvent) => {
                      (e.target as L.Path).setStyle({ fillOpacity: 0.7 });
                    },
                    mouseout: (e: LeafletMouseEvent) => {
                      (e.target as L.Path).setStyle({ fillOpacity: 0.3 });
                    },
                  }}
                  pathOptions={{
                    color: "#22c55e", // Green for OSM high accuracy
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.3,
                    interactive: true,
                  }}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="text-sm font-semibold">
                        {parcel.address}
                      </h3>
                      <div className="mt-1 space-y-1 text-xs text-gray-600">
                        {parcel.buildingType && (
                          <div>Type: {parcel.buildingType}</div>
                        )}
                        {parcel.buildingArea && (
                          <div>Area: {Math.round(parcel.buildingArea)} m²</div>
                        )}
                        {parcel.propertyType && (
                          <div>Use: {parcel.propertyType}</div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Polygon>
              );
            }

            return null;
          })}

          <MapEvents />

          {clickedPosition && (
            <Popup position={clickedPosition}>
              <div className="flex w-64 flex-col gap-2">
                {image.isPending ? (
                  <Skeleton className="h-48 w-64 rounded-xl" />
                ) : image.isSuccess && image.data ? (
                  <img
                    className="h-48 w-64"
                    src={`/${image.data.url}`}
                    alt="Street view"
                  />
                ) : (
                  <p>Failed to load image</p>
                )}
                <div className="mx-auto flex flex-row gap-2">
                  <Button
                    onClick={() => {
                      window.location.href = "/create";
                    }}
                    variant="secondary"
                  >
                    <Hammer className="h-10 w-12" />
                    Build
                  </Button>
                  <Button variant="secondary">
                    <Edit className="h-10 w-12" />
                    Edit
                  </Button>
                </div>
                <div>
                  <p>Previous Builds Nearby</p>
                  <div className="flex flex-row gap-4">
                    {nearbyImages.isPending ? (
                      <Skeleton className="h-16 w-14 rounded-xl" />
                    ) : nearbyImages.isSuccess && nearbyImages.data ? (
                      nearbyImages.data.map((image) => (
                        <div
                          key={image.id}
                          className="h-16 w-14 rounded-md bg-gray-400 p-1 shadow-2xl hover:bg-gray-200"
                          onClick={() => {
                            window.location.href = `/create/${image.id}`;
                          }}
                        >
                          <img
                            className="h-10 w-12"
                            src={`/${image.url}`}
                            alt="there will be a image here"
                          />
                          <div className="relative flex overflow-x-hidden">
                            <p className="animate-marquee whitespace-nowrap">
                              {image.address}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p>No nearby images</p>
                    )}
                  </div>
                </div>
              </div>
            </Popup>
          )}
        </MapContainer>
      </div>
      {currentZoom < 18 ? (
        <p>Zoom in more to be able to select a location</p>
      ) : (
        <p>Select a location to get a street view image</p>
      )}

      <div className="flex w-full max-w-sm gap-2 place-self-center">
        <Input type="text" placeholder="Address" />
        <Button variant="secondary" size="icon" className="size-8">
          <Search />
        </Button>
      </div>
    </div>
  );
}
