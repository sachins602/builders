import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { FeatureCollection } from 'geojson';
import TorontoGeoJSON from 'public/toronto_crs84.json';
import { api } from '~/trpc/react';
import ImagePopup from './imagepopup'; // Import the default export

// Fix for default Leaflet icon path issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


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
     
   if (!lat || !lng) return console.error("Error fetching image", "No latitude or longitude");
      image.mutate({
        lat: lat,
        lng: lng,
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
            <MapClickHandler onMapClick={() => { /* Placeholder, as original onMapClick for polygons was removed by user */ }} />
                  <ImagePopup />           
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