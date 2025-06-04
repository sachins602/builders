import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css';
import type { FeatureCollection } from 'geojson'; // Use FeatureCollection for more specific typing
import TorontoGeoJSON from 'public/toronto_crs84.json';
import { api } from '~/trpc/react';

// Type guard to check if the data is a valid FeatureCollection
// Using 'unknown' is safer than 'any' as it forces type checking.
function isFeatureCollection(data: unknown): data is FeatureCollection {
  // Check if data is an object and not null, then check for specific properties.
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  // Cast to a record of unknown values to safely access properties.
  const obj = data as Record<string, unknown>;
  return (
    obj.type === 'FeatureCollection' &&
    Array.isArray(obj.features)
  );
}

interface MapClickHandlerProps {
  onMapClick: (polygon: FeatureCollection) => void;
}

function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
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
      console.log('User clicked at:', e.latlng);
      const { lat, lng } = e.latlng;
      const offset = 0.00015; // Small offset to create a square polygon
      const polygonCoordinates = [
        [
          [lng - offset, lat - offset],
          [lng + offset, lat - offset],
          [lng + offset, lat + offset],
          [lng - offset, lat + offset],
          [lng - offset, lat - offset], // Close the polygon
        ],
      ];

      const newPolygon: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: polygonCoordinates,
            },
          },
        ],
      };
      onMapClick(newPolygon);
      image.mutate({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        heading: 0,
      },
      {
        onSuccess: (data) => {
          window.location.href = "/create";
        },
        onError: (error) => {
          console.error("Error saving image", error);
        },
      });
    },
  });
  return null; // This component does not render anything itself
}

export default function MapTest() {
  const [clickedPolygons, setClickedPolygons] = useState<FeatureCollection[]>([]);
  // Let TypeScript infer the type of TorontoGeoJSON.
  // If 'resolveJsonModule' is not true in tsconfig.json, this will likely be 'any'.
  const importedGeoJsonData = TorontoGeoJSON;


  if (isFeatureCollection(importedGeoJsonData)) {
    // If the type guard passes, TypeScript knows importedGeoJsonData is FeatureCollection here.
    // No need to cast 'importedGeoJsonData' to FeatureCollection again, it's inferred.
    return (
      <div className="">
        <h1>Map Test</h1>
        <div className="">
          <MapContainer  center={[43.6532, -79.3832]} zoom={10} scrollWheelZoom={true} style={{ height: '500px', width: '100%' }}>
            <TileLayer
            
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[51.505, -0.09]}>
              <Popup>
                A pretty CSS3 popup. <br /> Easily customizable.
              </Popup>
            </Marker>
            {/* 'importedGeoJsonData' is now safely typed as FeatureCollection here */}
            <GeoJSON data={importedGeoJsonData} style={() => ({ color: 'blue', weight: 3, opacity: 0.5, fillOpacity: 0 })} />
            <MapClickHandler onMapClick={(newPolygon) => setClickedPolygons(prevPolygons => [...prevPolygons, newPolygon])} />
            {clickedPolygons.map((polygon, index) => (
              <GeoJSON 
                key={`polygon-${index}`} // Add a unique key for each polygon
                data={polygon} 
                style={() => ({ color: 'red', weight: 2, fillOpacity: 0.2 })} 
              />
            ))}
          </MapContainer>
        </div>
      </div>
    );
  } else {
    console.error("TorontoGeoJSON data does not appear to be a valid FeatureCollection:", importedGeoJsonData);
    // Render a fallback UI or null if the data is not valid
    return (
      <div className="">
        <h1>Map Test</h1>
        <p>Error: Could not load map data. The GeoJSON data is invalid.</p>
      </div>
    );
  }
}