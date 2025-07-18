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
import { NavigationButtons } from "./NavigationButtons";
import { PropertyPopup } from "./PropertyPopup";
import { PropertyPolygons } from "./PropertyPolygons";
import { MapEvents } from "./MapEvents";

// Hooks
import { useMapSearch } from "./useMapSearch";
import { useMapToast } from "./useMapToast";

const maskPolygon: [number, number][][] = [...outerBounds, torontoBoundary];

export default function MapComponent() {
  // State management
  const [currentZoom, setCurrentZoom] = useState(INITIAL_ZOOM);
  const [clickedPosition, setClickedPosition] = useState<
    [number, number] | null
  >(null);
  const [searchBarVisible, setSearchBarVisible] = useState(true);
  const [toolBarVisible, setToolBarVisible] = useState(false);

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
    },
  });

  // Event handlers
  const handleSearchComplete = useCallback((lat: number, lng: number) => {
    setClickedPosition([lat, lng]);
    image.mutate({ lat, lng });
    setSearchBarVisible(false);
    setToolBarVisible(true);
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setClickedPosition([lat, lng]);
    image.mutate({ lat, lng });
    setSearchBarVisible(false);
    setToolBarVisible(true);
  }, []);

  const handleZoomChange = useCallback((zoom: number) => {
    setCurrentZoom(zoom);
    if (zoom < ZOOM_LIMIT) {
      setClickedPosition(null);
    }
  }, []);

  const handleMapRef = useCallback((map: L.Map) => {
    mapRef.current = map;
  }, []);

  const handleSearchClick = useCallback(() => {
    setSearchBarVisible(true);
    setToolBarVisible(false);
  }, []);

  const handleSearchBarClose = useCallback(() => {
    setSearchBarVisible(false);
    setToolBarVisible(true);
  }, []);

  // Search functionality
  const { performSearch } = useMapSearch({
    mapRef,
    onSearchComplete: handleSearchComplete,
  });

  // Show initial toast
  useEffect(() => {
    showMapToast(currentZoom);
  }, [currentZoom, showMapToast]);

  return (
    <div className="flex h-full w-full flex-col space-y-2">
      {/* Map Container */}
      <div className="h-[calc(100vh-400px)] w-full">
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
            showMapToast={showMapToast}
          />

          {clickedPosition && (
            <Popup position={clickedPosition}>
              <PropertyPopup
                isLoadingImage={image.isPending}
                imageData={image.data}
                onSave={(lat, lng) => image.mutate({ lat, lng })}
                clickedPosition={clickedPosition}
              />
            </Popup>
          )}
        </MapContainer>
      </div>

      {/* Controls */}
      <div className="flex w-full place-self-center">
        {searchBarVisible && (
          <SearchBar onSearch={performSearch} onClose={handleSearchBarClose} />
        )}
        {toolBarVisible && <ToolBar onSearchClick={handleSearchClick} />}
      </div>

      {/* Spacer - Builds to go here */}
      <div className="flex w-full flex-grow flex-row justify-center"></div>

      {/* Navigation Buttons */}
      <NavigationButtons />
    </div>
  );
}
