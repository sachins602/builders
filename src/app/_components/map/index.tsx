// React and hooks
import { useState, useRef, useEffect } from "react";

// Leaflet types
import type L from "leaflet";
import type { LeafletMouseEvent } from "leaflet";

// React-Leaflet components
import {
  MapContainer,
  Polygon,
  TileLayer,
  GeoJSON,
  useMapEvents,
  Popup,
} from "react-leaflet";

// Leaflet CSS
import "leaflet/dist/leaflet.css";

// Image
import Image from "next/image";

// TopoJSON data for Toronto
import TorontoTopoJSON from "public/toronto_crs84.json";

// Toronto city boundary polygon
import { torontoBoundary } from "./torontoBoundary";

// Environment variables
import { env } from "~/env";

// tRPC API hooks
import { api } from "~/trpc/react";
import { getImageUrl } from "~/lib/image-utils";

// UI components
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { toast } from "sonner";

// Icon components
import { Search, Hammer, Edit, X, TrendingUp } from "lucide-react";

// Types

type NominatimResult = {
  lat: string;
  lon: string;
  [key: string]: string;
};

const outerBounds: [number, number][][] = [
  [
    [90, -180],
    [90, 180],
    [-90, 180],
    [-90, -180],
  ],
];

// Zoom limit for showing different toasts
const zoomLimit = 18;

const maskPolygon: [number, number][][] = [...outerBounds, torontoBoundary];

export default function MapComponent() {
  // State for managing the current zoom level and clicked position
  const [currentZoom, setCurrentZoom] = useState(11);
  const [clickedPosition, setClickedPosition] = useState<
    [number, number] | null
  >(null);

  // Map Reference
  const mapRef = useRef<L.Map | null>(null);

  // Ref for the search button and search bar to toggle the search bar state
  const searchBarRef = useRef(null);

  // Variables for search button and search bar visibility
  const [searchBarVisible, setSearchBarVisible] = useState(true);
  const [toolBarVisible, setToolBarVisible] = useState(false);

  // Search functionality
  const [searchValue, setSearchValue] = useState("");

  async function performSearch(address: string): Promise<boolean> {
    if (!mapRef.current || !address.trim()) return false;

    try {
      // Use Nominatim API to search for the address
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      );

      // Check if the response is ok
      const results = (await response.json()) as NominatimResult[];

      if (results && results.length > 0) {
        const result = results[0];
        if (result?.lat !== undefined && result?.lon !== undefined) {
          const lat = parseFloat(result.lat);
          const lng = parseFloat(result.lon);

          mapRef.current?.setView([lat, lng], 16);
          toast(`Address found!`);

          // Hide the search bar and show the toolbar
          setSearchBarVisible(false);
          setToolBarVisible(true);

          // Set the clicked position to the result's center
          setClickedPosition([lat, lng]);

          return true;
        } else {
          toast("Location not found");
          return false;
        }
      } else {
        toast("Location not found");
        return false;
      }
    } catch (error) {
      console.error("Search error:", error);
      toast("Search failed. Please try again.");
      return false;
    }
  }

  // Toast state for managing notifications
  const [toastState, setToastState] = useState("");

  // Page Buttons
  function searchButton() {
    return (
      <Button
        variant="secondary"
        //ref={searchButton}

        onClick={() => {
          setSearchBarVisible(true);
          setToolBarVisible(false);
        }}
        className="m-2 flex h-24 w-24 flex-col p-2"
      >
        <Search className="m-2 h-32 w-32 scale-250" />
        <span>Search</span>
      </Button>
    );
  }

  function buildButton() {
    return (
      <Button
        variant="secondary"
        onClick={() => {
          window.location.href = "/create";
        }}
        className="m-2 flex h-24 w-24 flex-col p-2"
      >
        <Hammer className="m-2 h-32 w-32 scale-250" />
        <p>Build</p>
      </Button>
    );
  }

  function editButton() {
    return (
      <Button
        variant="secondary"
        onClick={() => {
          window.location.href = "/edit";
        }}
        className="m-2 flex h-24 w-24 flex-col p-2"
      >
        <Edit className="m-2 h-32 w-32 scale-250" />
        <p>Edit</p>
      </Button>
    );
  }

  function communityButton() {
    return (
      <Button
        variant="secondary"
        className="m-2 flex h-24 w-32 flex-col p-2"
        onClick={() => {
          window.location.href = "/community";
        }}
      >
        <TrendingUp className="h-16 w-16 scale-250" />
        <span className="text-lg">Community</span>
      </Button>
    );
  }

  function popularButton() {
    return (
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
    );
  }

  function searchBar() {
    return (
      <div
        id="search-bar"
        ref={searchBarRef}
        className="flex h-24 w-full flex-row"
      >
        <Input
          type="text"
          placeholder="Search for an address..."
          className="m-2"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyUp={async (e) => {
            if (e.key === "Enter") {
              await performSearch(searchValue);
            }
          }}
        />

        {/*Search Button*/}
        <Button
          variant="secondary"
          size="icon"
          className="m-2"
          onClick={async () => {
            await performSearch(searchValue);
          }}
        >
          <Search />
        </Button>

        {/* Close Button */}
        <Button
          variant="secondary"
          size="icon"
          className="m-2"
          onClick={() => {
            setSearchBarVisible(false);
            setToolBarVisible(true);
          }}
        >
          <X />
        </Button>
      </div>
    );
  }

  // Toast Logic
  function mapToast(zoom: number) {
    // Show a toast notification based on the zoom level
    // This prevents multiple toasts from showing when zooming in and out

    if (zoom < zoomLimit) {
      if (toastState != "zoomed out") {
        toast("Click on the map to zoom in and get a street view image");
        setToastState("zoomed out");
      }
    } else {
      if (toastState != "zoomed in") {
        toast("Click on a residential parcel to get a street view image");
        setToastState("zoomed in");
      }
    }
  }

  // tRPC API hooks
  const utils = api.useUtils();

  // Fetch parcel data with enhanced information
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

          // Show the search bar and hide the toolbar
          setSearchBarVisible(false);
          setToolBarVisible(true);
        }
      },
      moveend() {
        setCurrentZoom(map.getZoom());

        if (map.getZoom() < 18) {
          setClickedPosition(null);
          mapToast(map.getZoom());
        } else {
          mapToast(map.getZoom());
        }
      },
    });

    // Instantiate the geocoder control
    useEffect(() => {
      mapRef.current = map;
    }, [map]);

    return null;
  }

  // Page load functions
  mapToast(currentZoom); // Show the initial toast

  return (
    <div id="mainContainer" className="flex h-full w-full flex-col space-y-2">
      {/* ^ Main container for the map and toolbar */}

      {/*Map Container*/}
      <div id="mapDiv" className="h-[calc(100vh-400px)] w-full">
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

          {/* Map events for handling clicks and zoom changes */}
          <MapEvents />

          {clickedPosition && (
            <Popup position={clickedPosition}>
              <div className="flex w-64 flex-col gap-2">
                {image.isPending ? (
                  <Skeleton className="h-48 w-64 rounded-xl" />
                ) : image.isSuccess && image.data ? (
                  <Image
                    width={64}
                    height={48}
                    className="h-48 w-64"
                    src={getImageUrl(image.data.url)}
                    alt="Street view"
                  />
                ) : (
                  <p> {image.error?.message}</p>
                )}
                <div className="mx-auto flex flex-row gap-2"></div>
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
                          <Image
                            className="h-10 w-12"
                            height={10}
                            width={12}
                            src={`/${image.url}`}
                            alt={image.address ?? "Nearby Image"}
                            src={getImageUrl(image.url)}
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

      {/* Toolbar for search, build, and edit buttons */}
      <div className="flex w-full place-self-center">
        {/* Search Bar */}
        {searchBarVisible && searchBar()}

        {/* Tool Bar */}
        {toolBarVisible && (
          <div id="tool-bar" className="flex w-full flex-row justify-center">
            {/* Search Button */}
            {searchButton()}

            {/* Build Button */}
            {buildButton()}

            {/* Edit Button */}
            {editButton()}
          </div>
        )}
      </div>

      {/* Nearby Builds */}
      <div className="flex w-full flex-grow flex-row justify-center"></div>

      {/* Popular and Community Buttons */}

      {/*Popular Button*/}
      <div className="flex w-full flex-row justify-between">
        {popularButton()}

        {/*Community Button*/}
        {communityButton()}
      </div>
    </div>
  );
}
