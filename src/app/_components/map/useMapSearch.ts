import { useCallback } from "react";
import type L from "leaflet";
import { toast } from "sonner";
import type { NominatimResult } from "./types";

interface UseMapSearchProps {
  mapRef: React.RefObject<L.Map | null>;
  onSearchComplete: (lat: number, lng: number) => void;
}

export function useMapSearch({ mapRef, onSearchComplete }: UseMapSearchProps) {
  const performSearch = useCallback(
    async (address: string): Promise<boolean> => {
      if (!mapRef.current || !address.trim()) return false;

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        );

        const results = (await response.json()) as NominatimResult[];

        if (results && results.length > 0) {
          const result = results[0];
          if (result?.lat !== undefined && result?.lon !== undefined) {
            const lat = parseFloat(result.lat);
            const lng = parseFloat(result.lon);

            mapRef.current?.setView([lat, lng], 16);
            toast("Address found!");
            onSearchComplete(lat, lng);

            return true;
          } else {
            toast("Location not found");
            return false;
          }
        } else {
          toast("Location not found");
          return false;
        }
      } catch (error) {
        console.error("Search error:", error);
        toast("Search failed. Please try again.");
        return false;
      }
    },
    [mapRef, onSearchComplete],
  );

  return { performSearch };
}
