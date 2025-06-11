import {
  MapContainer,
  Polygon,
  TileLayer,
  useMap,
  GeoJSON,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import TorontoTopoJSON from "public/toronto_crs84.json";
import { useState, useEffect } from "react";

import { api } from "~/trpc/react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Search } from "lucide-react";
import { torontoBoundary } from "../maptest2/torontoBoundary";
import { env } from "~/env";

const outerBounds: [number, number][][] = [
  [
    [90, -180],
    [90, 180],
    [-90, 180],
    [-90, -180],
  ],
];

const maskPolygon: [number, number][][] = [...outerBounds, torontoBoundary];

// Component to programmatically update map view
function MapUpdater({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function MapComponent() {
  const [mapPositon, setMapPostion] = useState<{
    center: [number, number];
    zoomLevel: number;
  }>({
    center: [43.7, -79.42],
    zoomLevel: 11,
  });
  const image = api.response.saveStreetViewImage.useMutation({
    onSuccess: (data) => {
      if (data instanceof Error) {
        console.error("Error fetching image", data);
        return;
      }
    },
  });

  function MapClickHandler() {

    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        if (mapPositon.zoomLevel < 18) {
          setMapPostion({
            center: [lat, lng],
            zoomLevel: mapPositon.zoomLevel + 1,
          });
        }

        // if (!lat || !lng)
        //   return console.error(
        //     "Error fetching image",
        //     "No latitude or longitude",
        //   );
        // image.mutate(
        //   {
        //     lat: lat,
        //     lng: lng,
        //     heading: 0,
        //   },
        //   {
        //     onSuccess: () => {
        //       window.location.href = "/create";
        //     },
        //     onError: (error) => {
        //       console.error("Error saving image", error);
        //     },
        //   },
        // );
      }
    });
    return null; // This component does not render anything itself
  }

  return (
    <div className="flex h-full w-full flex-col space-y-2">
      <div className="h-[560px] w-full">
        <MapContainer
          center={[43.7, -79.42]} // Toronto coordinates
          zoom={mapPositon.zoomLevel}
          scrollWheelZoom={true}
          style={{ height: "500px", width: "100%" }}
        >
          <TileLayer
            url={`https://api.maptiler.com/maps/toner/{z}/{x}/{y}.png?key=${env.NEXT_PUBLIC_MAPTILER_KEY}`}
            attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* <MapUpdater center={} zoom={13} /> */}
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
          <MapUpdater center={mapPositon.center} zoom={mapPositon.zoomLevel} />
          {/* <ImagePopup /> */}
        </MapContainer>
      </div>
      {mapPositon.zoomLevel < 18 ? (
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
