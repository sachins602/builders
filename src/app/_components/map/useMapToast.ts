import { useState, useCallback } from "react";
import { toast } from "sonner";
import { ZOOM_LIMIT } from "./types";

export function useMapToast() {
  const [toastState, setToastState] = useState("");

  const showMapToast = useCallback(
    (zoom: number) => {
      if (zoom < ZOOM_LIMIT) {
        if (toastState !== "zoomed out") {
          toast("Click on the map to zoom in and get a street view image");
          setToastState("zoomed out");
        }
      } else {
        if (toastState !== "zoomed in") {
          toast("Click on a residential parcel to get a street view image");
          setToastState("zoomed in");
        }
      }
    },
    [toastState],
  );

  return { showMapToast };
}
