import {
  MapContainer,
  Polygon,
  TileLayer,
  GeoJSON,
  useMapEvents,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import TorontoTopoJSON from "public/toronto_crs84.json";
import { useState } from "react";

import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Search, Hammer, Edit } from "lucide-react";
import { torontoBoundary } from "../maptest2/torontoBoundary";
import { env } from "~/env";
import { Skeleton } from "../ui/skeleton";

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
  const [currentZoom, setCurrentZoom] = useState(11);
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
        setCurrentZoom(map.getZoom());
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
          center={[43.7, -79.42]} // Toronto coordinates
          zoom={11}
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

          {clickedPosition && (
            <Popup
              position={clickedPosition}
              
            >
              <div className="flex w-64 flex-col gap-2">
                {/* <img
                  className="h-48 w-60"
                  src="/omm-logo.png"
                  alt="there will be a image here"
                /> */}
                <Skeleton className="h-48 w-64 rounded-xl" />
                <div className="mx-auto flex flex-row gap-2">
                  <div className="flex flex-col items-center">
                    <Hammer className="h-10 w-12" />
                    <p>Build</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <Edit className="h-10 w-12" />
                    <p>Edit</p>
                  </div>
                </div>
                <div>
                  <p>Previous Builds Nearby</p>
                  <div className="flex flex-ro gap-4 ">
                  <Skeleton className="h-16 w-14 rounded-xl" />
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={index}
                        className="p-1 w-14 h-16  bg-gray-400 hover:bg-gray-200 rounded-md shadow-2xl"
                      >
                        <img
                          className="h-10 w-12"
                          src="/omm-logo.png"
                          alt="there will be a image here"
                        />
                        <p>{index + 1}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Popup>
          )}
        </MapContainer>
      </div>
      {currentZoom < 18 ? (
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
