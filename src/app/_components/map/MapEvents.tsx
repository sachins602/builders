import { useEffect } from "react";
import { useMapEvents } from "react-leaflet";
import type L from "leaflet";
import { ZOOM_LIMIT } from "./types";

interface MapEventsProps {
  onMapClick: (lat: number, lng: number) => void;
  onZoomChange: (zoom: number) => void;
  onMapRef: (map: L.Map) => void;
  onMapCenterChange: (center: [number, number]) => void;
  showMapToast: (zoom: number) => void;
}

export function MapEvents({
  onMapClick,
  onZoomChange,
  onMapRef,
  onMapCenterChange,
  showMapToast,
}: MapEventsProps) {
  const map = useMapEvents({
    click(e) {
      if (map.getZoom() < ZOOM_LIMIT) {
        map.flyTo(e.latlng, map.getZoom() + 1);
      } else {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
    moveend() {
      const zoom = map.getZoom();
      const center = map.getCenter();
      onZoomChange(zoom);
      onMapCenterChange([center.lat, center.lng]);
      showMapToast(zoom);
    },
  });

  useEffect(() => {
    onMapRef(map);
  }, [map, onMapRef]);

  return null;
}
