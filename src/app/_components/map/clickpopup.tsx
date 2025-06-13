import { Marker, Tooltip } from "react-leaflet";
import { Icon } from "leaflet";
import {  Hammer, Edit} from 'lucide-react';

const icon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconAnchor: [0, 0],
  popupAnchor: [0, 0],
  tooltipAnchor: [0, 0],
  className: "size-8",
});

export default function ClickPopup({
  position,
}: {
  position: [number, number] | null;
}) {
  if (!position) {
    return null;
  }

  return (
    <Marker position={position} icon={icon}>
      <Tooltip  permanent={true} direction="top" offset={[10, 0]}>
        <div className="flex w-64 flex-col gap-2">
          <img
            className="h-48 w-60"
            src="omm-logo.png"
            alt="there will be a image here"
          />
          <div className="flex flex-row gap-2 mx-auto">
          <div className="flex flex-col">
          <Hammer className="h-10 w-12" />
            <p>Build</p>
          </div>
          <div className="flex flex-col">
          <Edit className="h-10 w-12" />
            <p>Edit</p>
          </div>
          </div>
          <div>
            <p>Previous Builds Nearby</p>
            <div className="gap-4 flex flex-ro ">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="p-1 w-14 h-16  bg-gray-400 hover:bg-gray-200 rounded-md shadow-2xl">
                <img
                  className="h-10 w-12"
                  src="omm-logo.png"
                  alt="there will be a image here"
                />
                <p>{index + 1}</p>
              </div>
            ))}
            </div>
          </div>
        </div>
      </Tooltip>
    </Marker>
  );
}
