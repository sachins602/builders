"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type L from "leaflet";
import {
  MapContainer,
  Polygon,
  TileLayer,
  GeoJSON,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Data and utilities
import TorontoTopoJSON from "public/toronto_crs84.json";
import { torontoBoundary } from "./torontoBoundary";
import { env } from "~/env";
import { api } from "~/trpc/react";

// Types and constants
import { TORONTO_CENTER, INITIAL_ZOOM, ZOOM_LIMIT, outerBounds } from "./types";

// Components
import { SearchBar } from "./SearchBar";
import { ToolBar } from "./ToolBar";
import { PropertyPopup } from "./PropertyPopup";
import { PropertyPolygons } from "./PropertyPolygons";
import { MapEvents } from "./MapEvents";

// Hooks
import { useMapSearch } from "./useMapSearch";
import { useMapToast } from "./useMapToast";
import { NearbyResponses } from "./NearbyResponses";

const maskPolygon: [number, number][][] = [...outerBounds, torontoBoundary];
const TORONTO_BOUNDS: [[number, number], [number, number]] = [
  [43.5, -79.75], // Southwest corner (lat, lng)
  [44.0, -78.95], // Northeast corner (lat, lng)
];

// Consolidated state for popup/selection
interface SelectionState {
  position: [number, number] | null;
  existingImageData: {
    id: number;
    url: string;
    address?: string | null;
    buildingType?: string | null;
    buildingArea?: number | null;
    propertyType?: string | null;
  } | null;
  isFromSearch: boolean;
}

export default function MapComponent() {
  // State management - simplified
  const [currentZoom, setCurrentZoom] = useState(INITIAL_ZOOM);
  const [mapCenter, setMapCenter] = useState<[number, number]>(TORONTO_CENTER);
  const [showSearchBar, setShowSearchBar] = useState(true);

  // Consolidated selection state
  const [selection, setSelection] = useState<SelectionState>({
    position: null,
    existingImageData: null,
    isFromSearch: false,
  });

  // Refs
  const mapRef = useRef<L.Map | null>(null);

  // Custom hooks
  const { showMapToast } = useMapToast();

  // API hooks
  const utils = api.useUtils();
  const parcelData = api.response.getEnhancedParcelData.useQuery();
  const imagesQuery = api.response.getImages.useQuery();

  const image = api.response.saveStreetViewImageAddress.useMutation({
    onSuccess: () => {
      void utils.response.getChatData.invalidate();
    },
    onError: (error) => {
      console.error("Error fetching image:", error);
      // Clear selection on error
      setSelection({
        position: null,
        existingImageData: null,
        isFromSearch: false,
      });
    },
  });

  // Helper function to check if there's an existing image near the coordinates
  const checkForExistingImage = useCallback(
    (lat: number, lng: number) => {
      if (!imagesQuery.data) return null;

      // Find image within ~50 meters (roughly 0.0005 degrees)
      const threshold = 0.0005;
      const existingImage = imagesQuery.data.find(
        (img) =>
          img.lat &&
          img.lng &&
          Math.abs(img.lat - lat) < threshold &&
          Math.abs(img.lng - lng) < threshold,
      );

      return existingImage ?? null;
    },
    [imagesQuery.data],
  );

  // Unified handler for both search and click operations
  const handleLocationSelect = useCallback(
    (lat: number, lng: number, isFromSearch: boolean) => {
      const position: [number, number] = [lat, lng];

      if (isFromSearch) {
        // For search, always fetch new property data
        setSelection({
          position,
          existingImageData: null,
          isFromSearch: true,
        });
        image.mutate({ lat, lng });
      } else {
        // For click, check existing images first
        const existingImage = checkForExistingImage(lat, lng);
        setSelection({
          position,
          existingImageData: existingImage,
          isFromSearch: false,
        });

        if (!existingImage) {
          image.mutate({ lat, lng });
        }
      }

      setShowSearchBar(false);
    },
    [checkForExistingImage, image],
  );

  // Event handlers - simplified
  const handleSearchComplete = useCallback(
    (lat: number, lng: number) => {
      handleLocationSelect(lat, lng, true);
    },
    [handleLocationSelect],
  );

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      handleLocationSelect(lat, lng, false);
    },
    [handleLocationSelect],
  );

  // Search functionality
  const { performSearch } = useMapSearch({
    mapRef,
    onSearchComplete: handleSearchComplete,
  });

  const handleSearch = useCallback(
    async (address: string) => {
      const success = await performSearch(address);
      return success;
    },
    [performSearch],
  );

  const handleZoomChange = useCallback(
    (zoom: number) => {
      setCurrentZoom(zoom);
      // Clear popup if zoomed out too far and not from search
      if (
        zoom < ZOOM_LIMIT &&
        !selection.isFromSearch &&
        !selection.existingImageData
      ) {
        setSelection({
          position: null,
          existingImageData: null,
          isFromSearch: false,
        });
      }
    },
    [selection],
  );

  const handleMapRef = useCallback((map: L.Map) => {
    mapRef.current = map;
  }, []);

  const handleMapCenterChange = useCallback((center: [number, number]) => {
    setMapCenter(center);
  }, []);

  const handleSearchClick = useCallback(() => {
    setShowSearchBar(true);
    setSelection({
      position: null,
      existingImageData: null,
      isFromSearch: false,
    });
  }, []);

  const handleSearchBarClose = useCallback(() => {
    setShowSearchBar(false);
    setSelection({
      position: null,
      existingImageData: null,
      isFromSearch: false,
    });
  }, []);

  // Show initial toast
  useEffect(() => {
    showMapToast(currentZoom);
  }, [currentZoom, showMapToast]);

  return (
    <div className="w-full flex-col space-y-2">
      {/* Map Container */}
      <div className="h-[calc(100vh-370px)] w-full">
        <MapContainer
          center={TORONTO_CENTER}
          zoom={INITIAL_ZOOM}
          minZoom={10}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
          maxBounds={TORONTO_BOUNDS}
          maxBoundsViscosity={1.0}
        >
          <TileLayer
            url={`https://api.maptiler.com/maps/toner/{z}/{x}/{y}.png?key=${env.NEXT_PUBLIC_MAPTILER_KEY}`}
            attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <GeoJSON
            data={TorontoTopoJSON as GeoJSON.GeoJsonObject}
            style={(feature) => {
              // Type guard for GeoJSON feature
              const type =
                typeof feature === "object" &&
                feature &&
                "properties" in feature &&
                typeof feature.properties === "object" &&
                feature.properties &&
                "type" in feature.properties
                  ? (feature.properties as { type?: string }).type
                  : undefined;
              if (type === "water") {
                return {
                  color: "#4FC3F7",
                  fillColor: "#4FC3F7",
                  fillOpacity: 0.7,
                };
              }
              if (type === "park") {
                return {
                  color: "#81C784",
                  fillColor: "#81C784",
                  fillOpacity: 0.5,
                };
              }
              // Default: light gray
              return {
                color: "#BDBDBD",
                fillColor: "#F5F5F5",
                fillOpacity: 0.2,
              };
            }}
          />

          <Polygon
            positions={maskPolygon}
            pathOptions={{
              color: "#BDBDBD",
              weight: 2,
              fillColor: "#FAFAFA",
              opacity: 1,
              fillOpacity: 1,
            }}
            interactive={false}
          />

          <PropertyPolygons parcelData={parcelData.data} />

          <MapEvents
            onMapClick={handleMapClick}
            onZoomChange={handleZoomChange}
            onMapRef={handleMapRef}
            onMapCenterChange={handleMapCenterChange}
            showMapToast={showMapToast}
          />

          {selection.position && (
            <Popup position={selection.position}>
              <PropertyPopup
                isLoadingImage={image.isPending}
                imageData={image.data}
                existingImageData={selection.existingImageData}
              />
            </Popup>
          )}
        </MapContainer>
      </div>
      {/* Controls */}
      <div className="flex w-full place-self-center">
        {showSearchBar && (
          <SearchBar onSearch={handleSearch} onClose={handleSearchBarClose} />
        )}
        {!showSearchBar && (
          <ToolBar
            onSearchClick={handleSearchClick}
            showBuildEditButtons={selection.position !== null}
            existingImageId={selection.existingImageData?.id ?? null}
          />
        )}
      </div>
      {/* Spacer - Builds to go here */}
      <NearbyResponses currentZoom={currentZoom} mapCenter={mapCenter} />
    </div>
  );
}
