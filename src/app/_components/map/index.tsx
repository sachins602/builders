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

// State for selection (to show build/edit buttons or popup)
interface SelectionState {
  position: [number, number] | null;
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
    isFromSearch: false,
  });

  // Refs
  const mapRef = useRef<L.Map | null>(null);

  // Custom hooks
  const { showMapToast } = useMapToast();

  // API hooks
  const utils = api.useUtils();
  const parcelData = api.response.getEnhancedParcelData.useQuery();

  const image = api.response.saveStreetViewImageAddress.useMutation({
    onSuccess: () => {
      void utils.response.getChatData.invalidate();
    },
    onError: (error) => {
      console.error("Error fetching image:", error);
      // Clear selection on error
      setSelection({
        position: null,
        isFromSearch: false,
      });
    },
  });

  // Handler for search location selection
  const handleSearchSelect = useCallback(
    (lat: number, lng: number) => {
      const position: [number, number] = [lat, lng];

      // For search, set position to show build/edit buttons
      setSelection({
        position,
        isFromSearch: true,
      });

      // Fetch property image data for the location
      image.mutate({ lat, lng });
      setShowSearchBar(false);
    },
    [image],
  );

  // Event handlers - simplified
  const handleSearchComplete = useCallback(
    (lat: number, lng: number) => {
      handleSearchSelect(lat, lng);
    },
    [handleSearchSelect],
  );

  // Handler for when a property polygon is clicked - clear popup selection
  const handlePolygonClick = useCallback(() => {
    setSelection({
      position: null,
      isFromSearch: false,
    });
  }, []);

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
      // Clear selection if zoomed out too far and not from search
      if (zoom < ZOOM_LIMIT && !selection.isFromSearch) {
        setSelection({
          position: null,
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
      isFromSearch: false,
    });
  }, []);

  const handleSearchBarClose = useCallback(() => {
    setShowSearchBar(false);
    setSelection({
      position: null,
      isFromSearch: false,
    });
  }, []);

  // Point-in-polygon algorithm
  const isPointInPolygon = useCallback(
    (point: [number, number], polygon: [number, number][]) => {
      const [x, y] = point;
      let inside = false;

      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i]!;
        const [xj, yj] = polygon[j]!;

        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
          inside = !inside;
        }
      }

      return inside;
    },
    [],
  );

  // Handler for map clicks - only show popup when no parcel data exists
  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      // Check if there's parcel data at this location using proper polygon boundaries
      const hasParcelData = parcelData.data?.some((parcel) => {
        if (
          parcel.propertyBoundary?.coordinates &&
          Array.isArray(parcel.propertyBoundary.coordinates[0])
        ) {
          // Convert from [lng, lat] to [lat, lng] for the polygon check
          const coordinates = (
            parcel.propertyBoundary.coordinates[0] as [number, number][]
          ).map(([lng, lat]) => [lat, lng] as [number, number]);

          return isPointInPolygon([lat, lng], coordinates);
        }
        return false;
      });

      // Only show PropertyPopup when there's no parcel data
      if (!hasParcelData) {
        const position: [number, number] = [lat, lng];
        setSelection({
          position,
          isFromSearch: false,
        });
        // Fetch street view image
        image.mutate({ lat, lng });
        setShowSearchBar(false);
      }
    },
    [parcelData.data, image, isPointInPolygon],
  );

  // Show initial toast
  useEffect(() => {
    showMapToast(currentZoom);
  }, [currentZoom, showMapToast]);

  return (
    <div className="w-full flex-col space-y-2">
      {/* Map Container */}
      <div className="h-[calc(100vh-370px)] w-full drop-shadow-md">
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
            style={{
              color: "#BDBDBD",
              fillColor: "#F5F5F5",
              fillOpacity: 0.2,
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

          <PropertyPolygons
            onPopupClose={() =>
              setSelection({ position: null, isFromSearch: false })
            }
            parcelData={parcelData.data}
            onPolygonClick={handlePolygonClick}
          />

          <MapEvents
            onMapClick={handleMapClick}
            onZoomChange={handleZoomChange}
            onMapRef={handleMapRef}
            onMapCenterChange={handleMapCenterChange}
            showMapToast={showMapToast}
          />

          {selection.position && !selection.isFromSearch && (
            <Popup position={selection.position}>
              <PropertyPopup
                isLoadingImage={image.isPending}
                imageData={image.data}
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
            existingImageId={null}
          />
        )}
      </div>
      {/* Spacer - Builds to go here */}
      <NearbyResponses currentZoom={currentZoom} mapCenter={mapCenter} />
    </div>
  );
}
