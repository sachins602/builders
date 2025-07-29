import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { ZOOM_LIMIT } from "./types";

export function useMapToast() {
  const [toastState, setToastState] = useState("");
  const pathname = usePathname();

  // Dismiss toast when navigating away from the home page (map)
  useEffect(() => {
    if (pathname !== "/") {
      toast.dismiss();
    }
  }, [pathname]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      toast.dismiss();
    };
  }, []);

  const showMapToast = useCallback(
    (zoom: number) => {
      // Only show toast on the home page (map)
      if (pathname !== "/") {
        return;
      }

      if (zoom < ZOOM_LIMIT) {
        if (toastState !== "zoomed out") {
          toast("Click on the map to zoom in and get a street view image", {
            style: {
              marginTop: "30px",
            },
          });
          setToastState("zoomed out");
        }
      } else {
        if (toastState !== "zoomed in") {
          toast("Click on a residential parcel to get a street view image", {
            style: {
              marginTop: "30px",
            },
          });
          setToastState("zoomed in");
        }
      }
    },
    [toastState, pathname],
  );

  return { showMapToast };
}
