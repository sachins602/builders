// External library imports
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  GeoJSON,
  useMapEvents,
  Polygon,
} from "react-leaflet";
import type { FeatureCollection } from "geojson";
import { useEffect, useState } from 'react';

// Import toronto boundary data
import {torontoBoundary} from "./torontoBoundary";

// Project and local imports
import TorontoGeoJSON from "public/toronto_crs84.json";
import { api } from "~/trpc/react";
import ImagePopup from "./imagepopup"; // Import the default export
import { env } from "~/env";

// Used to definte the City of Toronto boundary
const outerBounds: [number, number][][] = [[
  [90, -180],
  [90, 180],
  [-90, 180],
  [-90, -180],
]];

/*const torontoBoundary: [number, number][] = [
  [43.8555, -79.6393],
  [43.8555, -79.1169],
  [43.5810, -79.1169],
  [43.5810, -79.6393],
];*/

const maskPolygon: [number, number][][] = [
  ...outerBounds,
  torontoBoundary,
];

// Type guard to check if the data is a valid FeatureCollection
// Using 'unknown' is safer than 'any' as it forces type checking.
function isFeatureCollection(data: unknown): data is FeatureCollection {
  // Check if data is an object and not null, then check for specific properties.
  if (typeof data !== "object" || data === null) {
    return false;
  }
  // Cast to a record of unknown values to safely access properties.
  const obj = data as Record<string, unknown>;
  return obj.type === "FeatureCollection" && Array.isArray(obj.features);
}

function MapClickHandler() {
  const image = api.response.saveStreetViewImage.useMutation({
    onSuccess: (data) => {
      if (data instanceof Error) {
        console.error("Error fetching image", data);
        return;
      }
    },
  });

  useMapEvents({
    click(e) {
      console.log("User clicked at:", e.latlng);
      const { lat, lng } = e.latlng;

      if (!lat || !lng)
        return console.error(
          "Error fetching image",
          "No latitude or longitude",
        );
      image.mutate(
        {
          lat: lat,
          lng: lng,
          heading: 0,
        },
        {
          onSuccess: () => {
            window.location.href = "/create";
          },
          onError: (error) => {
            console.error("Error saving image", error);
          },
        },
      );
    },
  });
  return null; // This component does not render anything itself
}

export default function MapTest() {
  // Let TypeScript infer the type of TorontoGeoJSON.
  // If 'resolveJsonModule' is not true in tsconfig.json, this will likely be 'any'.
  const importedGeoJsonData = TorontoGeoJSON;

  // State to hold the mask data
  const [maskData, setMaskData] = useState(null);

  if (isFeatureCollection(importedGeoJsonData)) {
    // If the type guard passes, TypeScript knows importedGeoJsonData is FeatureCollection here.
    // No need to cast 'importedGeoJsonData' to FeatureCollection again, it's inferred.
    return (

          <MapContainer
            center={[43.7192, -79.3832]}
            zoom={10}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%", minHeight: "275px" }}
          >

            <TileLayer
               url={`https://api.maptiler.com/maps/toner/{z}/{x}/{y}.png?key=${env.NEXT_PUBLIC_MAPTILER_KEY}`}
              attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

            <Marker position={[51.505, -0.09]}>
              <Popup>
                A pretty CSS3 popup. <br /> Easily customizable.
              </Popup>
            </Marker>

            {/* 'importedGeoJsonData' is now safely typed as FeatureCollection here */}
            <GeoJSON
              data={importedGeoJsonData}
              style={() => ({
                color: "black",
                weight: 2,
                opacity: 1,
                fillOpacity: 0,
                hover:{
                  color: "blue",
                  weight: 3,
                  fillOpacity: 0.5,
                }
              })}
            />

            {/* Add the mask polygon */}

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
            <MapClickHandler />
            <ImagePopup />
            
          </MapContainer>

    );
  } else {
    console.error(
      "TorontoGeoJSON data does not appear to be a valid FeatureCollection:",
      importedGeoJsonData,
    );

    // Render a fallback UI or null if the data is not valid
    return (
      <div className="">
        <h1>Map Test</h1>
        <p>Error: Could not load map data. The GeoJSON data is invalid.</p>
      </div>
    );
  }
}
