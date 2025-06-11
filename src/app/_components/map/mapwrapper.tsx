"use client";

import dynamic from "next/dynamic";

const MapWrapper = dynamic(() => import("./index"), {
  ssr: false,
});

export default MapWrapper;
