import type React from "react";
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import * as LCG from "leaflet-control-geocoder";

const GeocoderControl: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const geocoder = LCG.geocoder({
      defaultMarkGeocode: true,
      collapsed: true,
      placeholder: "Search for a location...",
    });

    geocoder.addTo(map);

    // Cleanup function
    return () => {
      map.removeControl(geocoder);
    };
  }, [map]);

  return null; // This component doesn't render anything visible
};

export default GeocoderControl;
