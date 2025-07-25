import { Polygon, Popup } from "react-leaflet";
import type { LeafletMouseEvent } from "leaflet";
import type L from "leaflet";
import type { PropertyData } from "./types";

interface PropertyPolygonsProps {
  parcelData?: PropertyData[];
  onPolygonClick?: () => void; // Add callback to notify parent
}

export function PropertyPolygons({
  parcelData,
  onPolygonClick,
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

                  console.log(`Property clicked: ${parcel.address}`);
                  console.log(`Building type: ${parcel.buildingType}`);
                  if (parcel.buildingArea) {
                    console.log(
                      `Building area: ${Math.round(parcel.buildingArea)} m²`,
                    );
                  }
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
              <Popup>
                <div className="p-2">
                  <h3 className="text-sm font-semibold">
                    {parcel.address ?? "Unknown Address"}
                  </h3>
                  <div className="mt-1 space-y-1 text-xs text-gray-600">
                    {parcel.buildingType && (
                      <div>Type: {parcel.buildingType}</div>
                    )}
                    {parcel.buildingArea && (
                      <div>Area: {Math.round(parcel.buildingArea)} m²</div>
                    )}
                    {parcel.propertyType && (
                      <div>Use: {parcel.propertyType}</div>
                    )}
                  </div>
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
