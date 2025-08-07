import { Fragment } from "react";
import { Marker, Polygon, Popup, Tooltip } from "react-leaflet";
import type { LeafletMouseEvent } from "leaflet";
import L from "leaflet";
import type { PropertyData } from "./types";
import { getImageUrl } from "~/lib/image-utils";

interface PropertyPolygonsProps {
  parcelData?: PropertyData[];
  onPopupClose: () => void;
  onPolygonClick?: (parcel: PropertyData) => void; // Add callback to notify parent with parcel data
}

export function PropertyPolygons({
  parcelData,
  onPolygonClick,
  onPopupClose,
}: PropertyPolygonsProps) {
  if (!parcelData) return null;

  function getPolygonCentroid(
    latLngCoordinates: [number, number][],
  ): [number, number] {
    const numPoints = latLngCoordinates.length;
    if (numPoints === 0) return [0, 0];

    let twiceArea = 0;
    let centroidLngTimesSixArea = 0;
    let centroidLatTimesSixArea = 0;

    for (let i = 0; i < numPoints; i++) {
      const [lat1, lng1] = latLngCoordinates[i]!; // y1, x1
      const [lat2, lng2] = latLngCoordinates[(i + 1) % numPoints]!; // y2, x2
      const cross = lng1 * lat2 - lng2 * lat1; // x1*y2 - x2*y1
      twiceArea += cross;
      centroidLngTimesSixArea += (lng1 + lng2) * cross;
      centroidLatTimesSixArea += (lat1 + lat2) * cross;
    }

    const area = twiceArea / 2;
    if (Math.abs(area) < 1e-7) {
      // Fallback: average of points
      const avgLat =
        latLngCoordinates.reduce((sum, [lat]) => sum + lat, 0) / numPoints;
      const avgLng =
        latLngCoordinates.reduce((sum, [, lng]) => sum + lng, 0) / numPoints;
      return [avgLat, avgLng];
    }

    const centroidLng = centroidLngTimesSixArea / (6 * area);
    const centroidLat = centroidLatTimesSixArea / (6 * area);
    return [centroidLat, centroidLng];
  }

  return (
    <>
      {parcelData.map((parcel) => {
        if (
          parcel.propertyBoundary?.coordinates &&
          Array.isArray(parcel.propertyBoundary.coordinates[0])
        ) {
          const coordinates = (
            parcel.propertyBoundary.coordinates[0] as [number, number][]
          ).map(([lng, lat]) => [lat, lng] as [number, number]);

          const centroid = getPolygonCentroid(coordinates);

          return (
            <Fragment key={parcel.id}>
              <Marker
                position={centroid}
                icon={L.icon({
                  iconUrl: "/images/blueprint.png",
                  iconSize: [20, 20],
                  iconAnchor: [10, 10],
                  popupAnchor: [0, -10],
                })}
                eventHandlers={{
                  click: (e: LeafletMouseEvent) => {
                    e.originalEvent.stopPropagation();
                    onPolygonClick?.(parcel);
                  },
                }}
              >
                {parcel.address && (
                  <Tooltip direction="top" offset={[0, -10]}>
                    {parcel.address}
                  </Tooltip>
                )}
              </Marker>

              <Polygon
                positions={coordinates}
                eventHandlers={{
                  click: (e: LeafletMouseEvent) => {
                    // Stop the event from bubbling to the map
                    e.originalEvent.stopPropagation();

                    // Notify parent that a polygon was clicked with parcel data
                    onPolygonClick?.(parcel);
                  },
                  mouseover: (e: LeafletMouseEvent) => {
                    (e.target as L.Path).setStyle({ fillOpacity: 0.7 });
                  },
                  mouseout: (e: LeafletMouseEvent) => {
                    (e.target as L.Path).setStyle({ fillOpacity: 0.3 });
                  },
                }}
                pathOptions={{
                  color: "#22c55e",
                  weight: 2,
                  opacity: 1,
                  fillOpacity: 0.3,
                  interactive: true,
                }}
              >
                <Popup
                  eventHandlers={{
                    popupclose: () => {
                      onPopupClose();
                    },
                    popupopen: () => {
                      // Popup opened
                    },
                  }}
                >
                  <div className="p-2">
                    <img
                      src={getImageUrl(parcel.imageUrl)}
                      alt="Property"
                      className="h-48 w-64 rounded-lg"
                    />
                    <h3 className="text-sm font-semibold">
                      {parcel.address ?? "Unknown Address"}
                    </h3>
                  </div>
                </Popup>
              </Polygon>
            </Fragment>
          );
        }
        return null;
      })}
    </>
  );
}
