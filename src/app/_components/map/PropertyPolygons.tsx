import { Fragment, useMemo } from "react";
import { Marker, Polygon, Popup, Tooltip } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
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
  parcelData = [],
  onPolygonClick,
  onPopupClose,
}: PropertyPolygonsProps) {
  // Always render hooks in a consistent order; handle empty data gracefully

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

  function getMaxClusterRadius(zoom: number): number {
    const latitudeForResolution = 43.7; // Toronto latitude
    const metersPerPixel =
      (156543.03392 * Math.cos((latitudeForResolution * Math.PI) / 180)) /
      Math.pow(2, zoom);
    const desiredMeters = 120; // cluster markers only when within ~120m
    const radiusInPixels = desiredMeters / metersPerPixel;
    const clamped = Math.max(2, Math.min(40, Math.round(radiusInPixels)));
    return clamped;
  }

  function createClusterIcon(cluster: unknown): L.DivIcon {
    // The cluster instance comes from Leaflet.markercluster; we only need child count
    const anyCluster = cluster as { getChildCount: () => number };
    const count = anyCluster.getChildCount();

    const size = count < 10 ? 30 : count < 50 ? 36 : 42;
    const imageSize = Math.round(size * 0.65);

    return L.divIcon({
      html: `
        <div style="position:relative; display:flex; align-items:center; justify-content:center; width:${size}px; height:${size}px; border-radius:50%; background:#ffffff; box-shadow:0 0 0 2px #2563eb, 0 2px 8px rgba(0,0,0,0.15);">
          <img src="/images/blueprint.png" alt="cluster" style="width:${imageSize}px; height:${imageSize}px; object-fit:contain; opacity:0.9;" />
          <span style="position:absolute; bottom:-6px; left:50%; transform:translateX(-50%); background:#111827; color:#fff; font-weight:700; font-size:11px; line-height:1; padding:2px 6px; border-radius:9999px; box-shadow:0 1px 2px rgba(0,0,0,0.2);">${count}</span>
        </div>
      `,
      className: "custom-cluster-icon",
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  const enrichedParcels = useMemo(() => {
    return parcelData
      .map((parcel) => {
        if (
          parcel.propertyBoundary?.coordinates &&
          Array.isArray(parcel.propertyBoundary.coordinates[0])
        ) {
          const coordinates = (
            parcel.propertyBoundary.coordinates[0] as [number, number][]
          ).map(([lng, lat]) => [lat, lng] as [number, number]);
          const centroid = getPolygonCentroid(coordinates);
          return { parcel, coordinates, centroid } as const;
        }
        return null;
      })
      .filter(
        (
          item,
        ): item is {
          parcel: PropertyData;
          coordinates: [number, number][];
          centroid: [number, number];
        } => item !== null,
      );
  }, [parcelData]);

  return (
    <>
      <MarkerClusterGroup
        chunkedLoading
        showCoverageOnHover={false}
        spiderfyOnMaxZoom
        removeOutsideVisibleBounds
        maxClusterRadius={getMaxClusterRadius}
        iconCreateFunction={createClusterIcon}
        disableClusteringAtZoom={17}
      >
        {enrichedParcels.map(({ parcel, centroid }) => (
          <Marker
            key={`marker-${parcel.id}`}
            position={centroid}
            icon={L.icon({
              iconUrl: "/images/blueprint.png",
              iconSize: [20, 20],
              iconAnchor: [20, 40],
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
        ))}
      </MarkerClusterGroup>

      {enrichedParcels.map(({ parcel, coordinates }) => (
        <Fragment key={`polygon-${parcel.id}`}>
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
      ))}
    </>
  );
}
