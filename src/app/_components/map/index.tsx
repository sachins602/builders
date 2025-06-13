import {
  MapContainer,
  Polygon,
  TileLayer,
  GeoJSON,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import TorontoTopoJSON from "public/toronto_crs84.json";
import { useState } from "react";

import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Search } from "lucide-react";
import { torontoBoundary } from "../maptest2/torontoBoundary";
import { env } from "~/env";
import ClickPopup from "./clickpopup";

const outerBounds: [number, number][][] = [
  [
    [90, -180],
    [90, 180],
    [-90, 180],
    [-90, -180],
  ],
];

const maskPolygon: [number, number][][] = [...outerBounds, torontoBoundary];


export default function MapComponent() {
  const [mapPositon, setMapPostion] = useState<{
    center: [number, number];
    zoomLevel: number;
  }>({
    center: [43.7, -79.42],
    zoomLevel: 11,
  });
  const [clickedPosition, setClickedPosition] = useState<[number, number] | null>(
    null,
  );

  function MapEvents() {
    const map = useMapEvents({
      click(e) {
        if (map.getZoom() < 18) {
          map.flyTo(e.latlng, map.getZoom() + 1);
        } else {
          setClickedPosition([e.latlng.lat, e.latlng.lng]);
        }
      },
      moveend() {
        setMapPostion({
          center: [map.getCenter().lat, map.getCenter().lng],
          zoomLevel: map.getZoom(),
        });
        if (map.getZoom() < 18) {
          setClickedPosition(null);
        }
      },
    });
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col space-y-2">
      <div className="h-[560px] w-full">
        <MapContainer
          center={mapPositon.center} // Toronto coordinates
          zoom={mapPositon.zoomLevel}
          
          scrollWheelZoom={true}
          style={{ height: "500px", width: "100%" }}
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

          <MapEvents />
          <ClickPopup position={clickedPosition} />
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
