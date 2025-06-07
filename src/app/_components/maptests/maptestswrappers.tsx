"use client";

import dynamic from "next/dynamic";

const MapTestWrappers = dynamic(() => import("./index"), {
  ssr: false,
});

export default MapTestWrappers;
