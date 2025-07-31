import { Polygon, Popup } from "react-leaflet";
import type { LeafletMouseEvent } from "leaflet";
import type L from "leaflet";
import type { PropertyData } from "./types";
import { getImageUrl } from "~/lib/image-utils";

interface PropertyPolygonsProps {
  parcelData?: PropertyData[];
  onPopupClose: () => void;
  onPolygonClick?: () => void; // Add callback to notify parent
}

export function PropertyPolygons({
  parcelData,
  onPolygonClick,
  onPopupClose,
}: PropertyPolygonsProps) {
  if (!parcelData) return null;

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

          return (
            <Polygon
              key={parcel.id}
              positions={coordinates}
              eventHandlers={{
                click: (e: LeafletMouseEvent) => {
                  // Stop the event from bubbling to the map
                  e.originalEvent.stopPropagation();

                  // Notify parent that a polygon was clicked (to clear selection state)
                  onPolygonClick?.();
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
                  popupclose: () => onPopupClose(),
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
          );
        }
        return null;
      })}
    </>
  );
}
