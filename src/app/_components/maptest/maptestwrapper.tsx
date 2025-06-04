"use client";

import dynamic from "next/dynamic";

const MapTestWrapper = dynamic(() => import("./index"), {
  ssr: false,
});

export default MapTestWrapper;
