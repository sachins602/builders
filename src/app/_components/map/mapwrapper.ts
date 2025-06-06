"use client";

import dynamic from "next/dynamic";

const MapWrapper = dynamic(() => import("./map"), {
  ssr: false,
});

export default MapWrapper;
