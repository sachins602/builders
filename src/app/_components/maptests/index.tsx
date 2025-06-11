import {
  ComposableMap,
  Geographies,
  Geography,
  Marker as SimpleMarker,
  ZoomableGroup,
} from "react-simple-maps";
import {
  MapContainer,
  TileLayer,
  Marker as LeafletMarker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import TorontoNhoodJson from "public/torontonhood.json";
import { useState, type CSSProperties, useEffect } from "react";



import { api } from "~/trpc/react";
import { geoCentroid } from "d3-geo";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Search } from "lucide-react";

type Geo = {
  type?: string;
  geometry?: Geometry;
  rsmKey?: string;
  svgPath?: string;
  properties?: Properties;
};

type Geometry = {
  type?: string;
  coordinates?: Array<Array<number[]>>;
};

type Properties = {
  name?: string;
  id?: number;
};

const defaultStyle: CSSProperties = {
  fill: "#ECEFF1",
  stroke: "#607D8B",
  strokeWidth: 0.75,
  outline: "none",
};

const hoverStyle: CSSProperties = {
  fill: "#CFD8DC",
  stroke: "#546E7A",
  strokeWidth: 1,
  outline: "none",
};

const pressedStyle: CSSProperties = {
  fill: "#B0BEC5",
  stroke: "#455A64",
  strokeWidth: 1,
  outline: "none",
};

// Component to programmatically update map view
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
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

export default function MapTestsComponent() {
  const [screenNumber, setScreenNumber] = useState<number>(0);
  // Set a more sensible initial position than [0,0]
  const [selectedPosition, setSelectedPostion] = useState<[number, number]>([
    43.6532,
    -79.3832,
  ]);
  const places = api.response.getPlacesDetails.useMutation()

  const handleMapClick = (address: string) => {
    places.mutate({address: address},{
      onSuccess: (data) => {
        if (data instanceof Error) {
          console.error("Error fetching image", data);
          return;
        }
        if (!data.lat || !data.lng) {
          console.error("Error fetching image", "No latitude or longitude");
          return;
        }
        console.log(data);
        // Set position first, then switch screens to ensure map initializes with correct center
        setSelectedPostion([data.lat, data.lng]);
        setScreenNumber(1);
      },
      onError: (error) => {
        console.error("Error fetching image", error);
      },
    })
    
  };
  return (
    <div className="flex h-full w-full">
      {screenNumber === 0 ?(
        <div className="mx-auto w-fit rounded-lg bg-slate-800 shadow-xl md:min-w-[700px] lg:min-w-[1000px]">
          <ComposableMap
            style={{ width: "100%", height: "500px" }}
            projectionConfig={{
              center: [2.134452502762784, 62.9378024270368],
            scale: 500,
          }}
        >
          <ZoomableGroup minZoom={0.4} maxZoom={20}>
            <Geographies geography={TorontoNhoodJson}>
              {({ geographies }) => (
                <>
                  {geographies.map((geo: Geo, i) => (
                    <Geography
                      onClick={() => handleMapClick(geo.properties?.name ?? "")}
                      key={i}
                      height="100%"
                      width="100%"
                      geography={geo}
                      style={{
                        default: defaultStyle,
                        hover: hoverStyle,
                        pressed: pressedStyle,
                      }}
                    ></Geography>
                  ))}
                  {geographies.map((geo: Geo) => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
                    const centroid = geoCentroid(geo as any);
                    return (
                      <g key={geo.rsmKey}>
                        <SimpleMarker coordinates={centroid}>
                          <text
                            fontSize={3} // Increased font size
                            textAnchor="middle"
                            fill="#263238" // Added fill color for better readability
                            style={{ pointerEvents: "none" }} // Prevent text from capturing mouse events
                          >
                            {geo.properties?.name}
                          </text>
                        </SimpleMarker>
                      </g>
                    );
                  })}
                </>
              )}
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
        <div className="flex w-full max-w-sm gap-2 place-self-center">
          <Input type="text" placeholder="Address" />
          <Button variant="secondary" size="icon" className="size-8">
            <Search />
          </Button>
        </div>
      </div>
      ):(
      <div className="h-[500px] w-full">
        <MapContainer
        
          center={selectedPosition}
          zoom={10}
          scrollWheelZoom={true}
          style={{ height: "500px", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          

          <MapUpdater center={selectedPosition} zoom={13} />

          <MapClickHandler />
          {/* <ImagePopup /> */}
        </MapContainer>
      </div>
      )}
    </div>
  );
}
