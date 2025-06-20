export interface PropertyBoundary {
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  source: "osm";
  accuracy: "high";
  properties: {
    osmId?: string;
    osmType?: "way" | "relation";
    propertyType?: string;
    buildingType?: string;
    lotArea?: number;
    buildingArea?: number;
    address?: string;
    [key: string]: unknown;
  };
}

// Type definitions for OSM Overpass API responses
interface OSMCoordinate {
  lat: number;
  lon: number;
}

interface OSMElement {
  id: number;
  type: "way" | "relation" | "node";
  geometry?: OSMCoordinate[];
  tags?: Record<string, string>;
}

interface OSMOverpassResponse {
  elements: OSMElement[];
}

// OSM Overpass API queries for building boundaries
const getOSMBuildingBoundary = async (
  lat: number,
  lng: number,
  radius = 50,
): Promise<PropertyBoundary | null> => {
  try {
    // Overpass QL query to find buildings near the clicked point
    const overpassQuery = `
      [out:json][timeout:25];
      (
        way["building"](around:${radius},${lat},${lng});
        relation["building"](around:${radius},${lat},${lng});
      );
      out geom;
    `;

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = (await response.json()) as OSMOverpassResponse;

    if (!data.elements || data.elements.length === 0) {
      return null;
    }

    // Find the closest building to the clicked point
    let closestBuilding: OSMElement | null = null;
    let minDistance = Infinity;

    for (const element of data.elements) {
      if (element.type === "way" && element.geometry) {
        // Calculate center of building
        const coordinates = element.geometry;
        const centerLat =
          coordinates.reduce((sum, coord) => sum + coord.lat, 0) /
          coordinates.length;
        const centerLng =
          coordinates.reduce((sum, coord) => sum + coord.lon, 0) /
          coordinates.length;

        // Calculate distance from clicked point
        const distance = Math.sqrt(
          Math.pow(lat - centerLat, 2) + Math.pow(lng - centerLng, 2),
        );

        if (distance < minDistance) {
          minDistance = distance;
          closestBuilding = element;
        }
      }
    }

    if (!closestBuilding?.geometry) {
      return null;
    }

    // Convert OSM geometry to GeoJSON
    const coordinates = closestBuilding.geometry.map(
      (coord) => [coord.lon, coord.lat] as [number, number],
    );

    // Ensure the polygon is closed
    if (coordinates.length > 0) {
      const firstCoord = coordinates[0];
      const lastCoord = coordinates[coordinates.length - 1];
      if (
        firstCoord &&
        lastCoord &&
        (firstCoord[0] !== lastCoord[0] || firstCoord[1] !== lastCoord[1])
      ) {
        coordinates.push(firstCoord);
      }
    }

    const geometry: GeoJSON.Polygon = {
      type: "Polygon",
      coordinates: [coordinates],
    };

    return {
      geometry,
      source: "osm",
      accuracy: "high",
      properties: {
        osmId: closestBuilding.id.toString(),
        osmType:
          closestBuilding.type === "node" ? undefined : closestBuilding.type,
        buildingType: closestBuilding.tags?.building ?? "yes",
        propertyType:
          closestBuilding.tags?.["building:use"] ??
          getPropertyTypeFromBuilding(closestBuilding.tags?.building),
        address: formatOSMAddress(closestBuilding.tags),
        ...closestBuilding.tags,
      },
    };
  } catch (error) {
    console.error("Error fetching OSM building boundary:", error);
    return null;
  }
};

// Main function to get property boundary
export const getPropertyBoundary = async (
  lat: number,
  lng: number,
): Promise<PropertyBoundary | null> => {
  // Try OSM (most detailed building outlines)
  const boundary = await getOSMBuildingBoundary(lat, lng);
  if (boundary) {
    console.log("Using OSM boundary data");
    return boundary;
  }

  // If no boundary is found, return null
  console.log("No OSM boundary found at this location.");
  return null;
};

// Helper functions
const getPropertyTypeFromBuilding = (
  buildingType: string | undefined,
): string => {
  if (!buildingType) return "unknown";

  const residentialTypes = [
    "house",
    "detached",
    "semidetached_house",
    "terraced",
    "apartments",
  ];
  const commercialTypes = ["commercial", "office", "retail", "shop"];
  const industrialTypes = ["industrial", "warehouse", "factory"];

  if (residentialTypes.includes(buildingType)) return "residential";
  if (commercialTypes.includes(buildingType)) return "commercial";
  if (industrialTypes.includes(buildingType)) return "industrial";

  return "mixed";
};

const formatOSMAddress = (
  tags: Record<string, string> | undefined,
): string | undefined => {
  if (!tags) return undefined;

  const parts = [];
  if (tags["addr:housenumber"]) parts.push(tags["addr:housenumber"]);
  if (tags["addr:street"]) parts.push(tags["addr:street"]);
  if (tags["addr:city"]) parts.push(tags["addr:city"]);

  return parts.length > 0 ? parts.join(" ") : undefined;
};

const calculatePolygonArea = (polygon: GeoJSON.Polygon): number => {
  // Simplified area calculation (not perfectly accurate for lat/lng)
  // For production, use a proper geospatial library like Turf.js
  const coords = polygon.coordinates[0];
  if (!coords || coords.length < 3) return 0;

  let area = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    const coord1 = coords[i];
    const coord2 = coords[i + 1];
    if (!coord1 || !coord2 || coord1.length < 2 || coord2.length < 2) continue;

    const x1 = coord1[0]!;
    const y1 = coord1[1]!;
    const x2 = coord2[0]!;
    const y2 = coord2[1]!;
    area += x1 * y2 - x2 * y1;
  }

  return Math.abs(area / 2) * 111320 * 111320; // Rough conversion to square meters
};
