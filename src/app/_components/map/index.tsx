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

export default function MapComponent() {
  // State management
  const [currentZoom, setCurrentZoom] = useState(INITIAL_ZOOM);
  const [clickedPosition, setClickedPosition] = useState<
    [number, number] | null
  >(null);
  const [searchBarVisible, setSearchBarVisible] = useState(true);
  const [toolBarVisible, setToolBarVisible] = useState(false);
  const [isSearchOperation, setIsSearchOperation] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(TORONTO_CENTER);
  const [existingImageData, setExistingImageData] = useState<{
    id: number;
    url: string;
    address?: string | null;
    buildingType?: string | null;
    buildingArea?: number | null;
    propertyType?: string | null;
  } | null>(null);

  // Refs
  const mapRef = useRef<L.Map | null>(null);
  const searchOperationRef = useRef(false);

  // Custom hooks
  const { showMapToast } = useMapToast();

  // API hooks
  const utils = api.useUtils();
  const parcelData = api.response.getEnhancedParcelData.useQuery();
  const imagesQuery = api.response.getImages.useQuery();

  const image = api.response.saveStreetViewImageAddress.useMutation({
    onSuccess: () => {
      void utils.response.getChatData.invalidate();
      setIsSearchOperation(false);
      searchOperationRef.current = false;
    },
    onError: (error) => {
      console.error("Error fetching image:", error);
      setIsSearchOperation(false);
      searchOperationRef.current = false;
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

  // Event handlers
  const handleSearchComplete = useCallback(
    (lat: number, lng: number) => {
      setClickedPosition([lat, lng]);

      // For search, always fetch new property data instead of checking existing images
      // This ensures we get the latest property information
      setExistingImageData(null);
      image.mutate({ lat, lng });
      // Don't clear isSearchOperation here - let the mutation success/error handlers do it

      setSearchBarVisible(false);
      setToolBarVisible(true);
    },
    [image],
  );

  // Search functionality
  const { performSearch } = useMapSearch({
    mapRef,
    onSearchComplete: handleSearchComplete,
  });

  // Wrapper function to handle search with proper state management
  const handleSearch = useCallback(
    async (address: string) => {
      setIsSearchOperation(true);
      searchOperationRef.current = true;
      setExistingImageData(null);

      // Fallback timeout to clear search operation state
      const timeoutId = setTimeout(() => {
        setIsSearchOperation(false);
        searchOperationRef.current = false;
      }, 5000); // Clear after 5 seconds if not cleared elsewhere

      try {
        const success = await performSearch(address);
        clearTimeout(timeoutId);
        if (!success) {
          setIsSearchOperation(false);
          searchOperationRef.current = false;
        }
        return success;
      } catch (error) {
        console.error("Error searching:", error);
        clearTimeout(timeoutId);
        setIsSearchOperation(false);
        searchOperationRef.current = false;
        return false;
      }
    },
    [performSearch],
  );

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      setClickedPosition([lat, lng]);
      setIsSearchOperation(false);

      // Check for existing image first
      const existingImage = checkForExistingImage(lat, lng);
      if (existingImage) {
        setExistingImageData(existingImage);
      } else {
        setExistingImageData(null);
        image.mutate({ lat, lng });
      }

      setSearchBarVisible(false);
      setToolBarVisible(true);
    },
    [checkForExistingImage, image],
  );

  const handleZoomChange = useCallback(
    (zoom: number) => {
      setCurrentZoom(zoom);
      // Don't clear popup if we're in a search operation or if there's an existing image
      if (
        zoom < ZOOM_LIMIT &&
        !searchOperationRef.current &&
        !existingImageData
      ) {
        setClickedPosition(null);
      }
    },
    [existingImageData],
  );

  const handleMapRef = useCallback((map: L.Map) => {
    mapRef.current = map;
  }, []);

  const handleMapCenterChange = useCallback((center: [number, number]) => {
    setMapCenter(center);
  }, []);

  const handleSearchClick = useCallback(() => {
    setSearchBarVisible(true);
    setToolBarVisible(false);
    setClickedPosition(null);
    setExistingImageData(null);
  }, []);

  const handleSearchBarClose = useCallback(() => {
    setSearchBarVisible(false);
    setToolBarVisible(true);
    setClickedPosition(null);
    setExistingImageData(null);
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

          <PropertyPolygons parcelData={parcelData.data} />

          <MapEvents
            onMapClick={handleMapClick}
            onZoomChange={handleZoomChange}
            onMapRef={handleMapRef}
            onMapCenterChange={handleMapCenterChange}
            showMapToast={showMapToast}
          />

          {clickedPosition && (
            <Popup position={clickedPosition}>
              <PropertyPopup
                isLoadingImage={image.isPending}
                imageData={image.data}
                existingImageData={existingImageData}
              />
            </Popup>
          )}
        </MapContainer>
      </div>
      {/* Controls */}
      <div className="flex w-full place-self-center">
        {searchBarVisible && (
          <SearchBar onSearch={handleSearch} onClose={handleSearchBarClose} />
        )}
        {toolBarVisible && (
          <ToolBar
            onSearchClick={handleSearchClick}
            showBuildEditButtons={clickedPosition !== null}
            existingImageId={existingImageData?.id ?? null}
          />
        )}
      </div>
      {/* Spacer - Builds to go here */}
      <NearbyResponses currentZoom={currentZoom} mapCenter={mapCenter} />
    </div>
  );
}
