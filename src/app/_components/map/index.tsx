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
import {
  TORONTO_CENTER,
  INITIAL_ZOOM,
  ZOOM_LIMIT,
  outerBounds,
  type PropertyData,
} from "./types";

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
  hasParcelData: boolean;
  selectedParcel?: PropertyData | null; // Track the selected parcel data
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
    hasParcelData: false,
    selectedParcel: null,
  });

  // Refs
  const mapRef = useRef<L.Map | null>(null);

  // Custom hooks
  const { showMapToast } = useMapToast();

  // Helper function to clear selection
  const clearSelection = useCallback(() => {
    setSelection({
      position: null,
      isFromSearch: false,
      hasParcelData: false,
      selectedParcel: null,
    });
  }, []);

  // API hooks
  const utils = api.useUtils();
  const parcelData = api.response.getEnhancedParcelData.useQuery();

  const image = api.response.saveStreetViewImage.useMutation({
    onSuccess: () => {
      void utils.response.getChatData.invalidate();
    },
    onError: (error) => {
      console.error("Error fetching image:", error);
      // Clear selection on error
      clearSelection();
    },
  });

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

  // Handler for search location selection
  const handleSearchSelect = useCallback(
    (lat: number, lng: number) => {
      const position: [number, number] = [lat, lng];

      // Check if there's parcel data at the searched location
      const clickedParcel = parcelData.data?.find((parcel) => {
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

      if (clickedParcel) {
        // If there's parcel data at the searched location, select the parcel (show Remix button)
        setSelection({
          position: null,
          isFromSearch: true,
          hasParcelData: true,
          selectedParcel: clickedParcel,
        });
      } else {
        // If there's no parcel data, show PropertyPopup (show Build button)
        setSelection({
          position,
          isFromSearch: true,
          hasParcelData: false,
          selectedParcel: null,
        });
        // Only fetch image if there's no parcel data (PropertyPopup will need it)
        image.mutate({ lat, lng });
      }

      // Hide search bar only after successful search and selection
      setShowSearchBar(false);
    },
    [image, parcelData.data, isPointInPolygon],
  );

  // Event handlers - simplified
  const handleSearchComplete = useCallback(
    (lat: number, lng: number) => {
      handleSearchSelect(lat, lng);
    },
    [handleSearchSelect],
  );

  // Handler for when a property polygon is clicked - now receives parcel data
  const handlePolygonClick = useCallback((parcel: PropertyData) => {
    setSelection({
      position: null,
      isFromSearch: false,
      hasParcelData: true,
      selectedParcel: parcel,
    });
    // Hide search bar when a parcel is clicked
    setShowSearchBar(false);
  }, []);

  // Search functionality
  const { performSearch } = useMapSearch({
    mapRef,
    onSearchComplete: handleSearchComplete,
  });

  const handleSearch = useCallback(
    async (address: string) => {
      const success = await performSearch(address);
      // Only hide search bar and proceed with selection if search was successful
      if (success) {
        // Search was successful, the handleSearchComplete callback will handle the rest
        return true;
      } else {
        // Search failed, keep search bar visible and don't change selection state
        // Also clear any existing selection to prevent state confusion
        clearSelection();
        return false;
      }
    },
    [performSearch, clearSelection],
  );

  const handleZoomChange = useCallback(
    (zoom: number) => {
      setCurrentZoom(zoom);
      // Clear selection if zoomed out too far and not from search
      if (zoom < ZOOM_LIMIT && !selection.isFromSearch) {
        clearSelection();
      }
    },
    [selection, clearSelection],
  );

  const handleMapRef = useCallback((map: L.Map) => {
    mapRef.current = map;
  }, []);

  const handleMapCenterChange = useCallback((center: [number, number]) => {
    setMapCenter(center);
  }, []);

  const handleSearchClick = useCallback(() => {
    setShowSearchBar(true);
    clearSelection();
  }, [clearSelection]);

  const handleSearchBarClose = useCallback(() => {
    setShowSearchBar(false);
    clearSelection();
  }, [clearSelection]);

  // Handler for map clicks - handle both parcel and non-parcel locations
  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      // Check if there's parcel data at this location using proper polygon boundaries
      const clickedParcel = parcelData.data?.find((parcel) => {
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

      // If there's already a selection and we're clicking elsewhere, clear it
      if (selection.selectedParcel || selection.position) {
        clearSelection();
        return;
      }

      if (clickedParcel) {
        // If there's parcel data at this location, select the parcel (show Remix button)
        setSelection({
          position: null,
          isFromSearch: false,
          hasParcelData: true,
          selectedParcel: clickedParcel,
        });
        setShowSearchBar(false);
      } else {
        // If there's no parcel data, show PropertyPopup (show Build button)
        const position: [number, number] = [lat, lng];
        setSelection({
          position,
          isFromSearch: false,
          hasParcelData: false,
          selectedParcel: null,
        });
        // Fetch street view image
        image.mutate({ lat, lng });
        setShowSearchBar(false);
      }
    },
    [parcelData.data, image, isPointInPolygon, selection, clearSelection],
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
            onPopupClose={() => {
              // Always clear selection when any popup is closed
              // This will make the buttons disappear
              clearSelection();
            }}
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

          {selection.position && !selection.hasParcelData && (
            <Popup
              position={selection.position}
              eventHandlers={{
                popupclose: () => {
                  // Clear selection when PropertyPopup is closed
                  clearSelection();
                },
              }}
            >
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
          <>
            <ToolBar
              onSearchClick={handleSearchClick}
              showBuildEditButtons={
                selection.position !== null || selection.selectedParcel !== null
              }
              existingImageId={selection.selectedParcel?.id ?? null}
              buildExists={selection.selectedParcel !== null}
              selectedParcel={selection.selectedParcel}
              hasParcelData={selection.hasParcelData}
            />
          </>
        )}
      </div>
      {/* Spacer - Builds to go here */}
      <NearbyResponses currentZoom={currentZoom} mapCenter={mapCenter} />
    </div>
  );
}
