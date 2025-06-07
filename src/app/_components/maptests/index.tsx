import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import TorontoNhoodJson from "public/torontonhood.json";
import type { CSSProperties } from "react";

import { geoCentroid } from "d3-geo";

type Geo = {
  type?: string;
  geometry?: Geometry;
  rsmKey?: string;
  svgPath?: string;
  properties?: Properties;
};

type Geometry = {
  type?: string;
  coordinates?: Array<Array<number[]>>;
};

type Properties = {
  name?: string;
  id?: number;
};

const defaultStyle: CSSProperties = {
  fill: "#D6D6DA",
};

const hoverStyle: CSSProperties = {
  fill: "#F53",
};

const pressedStyle: CSSProperties = {
  fill: "##00FF00",
};
export default function MapTestsComponent() {
  return (
    <div className="w-fit mx-auto rounded-lg bg-slate-800 shadow-xl md:h-[450px] md:min-w-[700px] lg:h-[550px] lg:min-w-[1000px]">
      <ComposableMap
        style={{ width: "100%", height: "100%" }}
        projectionConfig={{
          center: [2.134452502762784, 62.9378024270368],
          scale: 500,
        }}
      >
        <ZoomableGroup minZoom={0.4} maxZoom={20}>
          <Geographies geography={TorontoNhoodJson}>
            {({ geographies }) => (
              <>
                {geographies.map((geo: Geo, i) => (
                  <Geography
                    onClick={() => console.log(geo)}
                    key={i}
                    height="100%"
                    width="100%"
                    geography={geo}
                    style={{
                      default: defaultStyle,
                      hover: hoverStyle,
                      pressed: pressedStyle,
                    }}
                  ></Geography>
                ))}
                {geographies.map((geo: Geo) => {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
                  const centroid = geoCentroid(geo as any);
                  return (
                    <g key={geo.rsmKey}>
                      <Marker coordinates={centroid}>
                        <text
                          className="text-black"
                          fontSize={1}
                          textAnchor="middle"
                        >
                          {geo.properties?.name}
                        </text>
                      </Marker>
                    </g>
                  );
                })}
              </>
            )}
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
