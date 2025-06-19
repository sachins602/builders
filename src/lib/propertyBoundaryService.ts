import { env } from "~/env";

export interface PropertyBoundary {
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  source: "osm" | "toronto_open_data" | "google" | "fallback";
  accuracy: "high" | "medium" | "low";
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

// Type definitions for Google Geocoding API
interface GoogleBounds {
  southwest: { lat: number; lng: number };
  northeast: { lat: number; lng: number };
}

interface GoogleGeometry {
  bounds?: GoogleBounds;
}

interface GoogleGeocodingResult {
  formatted_address: string;
  place_id: string;
  geometry: GoogleGeometry;
  types: string[];
}

interface GoogleGeocodingResponse {
  results: GoogleGeocodingResult[];
  status: string;
}

// Type definitions for Toronto Open Data API
interface TorontoDataRecord {
  address: string;
  // Add other fields as needed
}

interface TorontoDataResponse {
  result?: {
    records: TorontoDataRecord[];
  };
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

// Toronto Open Data API for property parcels
const getTorontoPropertyParcel = async (
  lat: number,
  lng: number,
): Promise<PropertyBoundary | null> => {
  try {
    // Toronto's Address Points API endpoint
    const response = await fetch(
      `https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/datastore_search_sql?sql=SELECT * FROM "4ef7e8e0-821a-486c-82b8-2fa5b4b23bbb" WHERE ST_Contains(geometry, ST_GeomFromText('POINT(${lng} ${lat})', 4326)) LIMIT 1`,
    );

    if (!response.ok) {
      throw new Error(`Toronto Open Data API error: ${response.status}`);
    }

    const data = (await response.json()) as TorontoDataResponse;

    if (!data.result?.records || data.result.records.length === 0) {
      return null;
    }

    const record = data.result.records[0];
    if (!record) {
      return null;
    }

    // Note: This is a simplified approach. For actual property boundaries,
    // you would need to use the Property Data Map or similar services
    // For now, we'll create a buffer around the address point
    return createBufferBoundary(lat, lng, "toronto_open_data", {
      address: record.address,
      propertyType: "residential", // This would come from actual property data
    });
  } catch (error) {
    console.error("Error fetching Toronto property parcel:", error);
    return null;
  }
};

// Enhanced Google Geocoding with property insights
const getGooglePropertyBoundary = async (
  lat: number,
  lng: number,
): Promise<PropertyBoundary | null> => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&result_type=premise|subpremise&key=${env.NEXT_PUBLIC_GOOGLE_API_KEY}`,
    );

    if (!response.ok) {
      throw new Error(`Google Geocoding API error: ${response.status}`);
    }

    const data = (await response.json()) as GoogleGeocodingResponse;

    if (!data.results || data.results.length === 0) {
      return null;
    }

    const result = data.results[0];
    if (!result) {
      return null;
    }
    const bounds = result.geometry?.bounds;

    if (bounds) {
      // Convert Google bounds to polygon
      const coordinates = [
        [bounds.southwest.lng, bounds.southwest.lat],
        [bounds.northeast.lng, bounds.southwest.lat],
        [bounds.northeast.lng, bounds.northeast.lat],
        [bounds.southwest.lng, bounds.northeast.lat],
        [bounds.southwest.lng, bounds.southwest.lat],
      ];

      const geometry: GeoJSON.Polygon = {
        type: "Polygon",
        coordinates: [coordinates],
      };

      return {
        geometry,
        source: "google",
        accuracy: "medium",
        properties: {
          address: result.formatted_address,
          propertyType: inferPropertyTypeFromAddress(result),
          placeId: result.place_id,
        },
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching Google property boundary:", error);
    return null;
  }
};

// Fallback: Create a reasonable building-sized boundary
const createBufferBoundary = (
  lat: number,
  lng: number,
  source: PropertyBoundary["source"] = "fallback",
  properties: Record<string, unknown> = {},
): PropertyBoundary => {
  // Create a small buffer around the point (approximately 20m x 20m)
  const latBuffer = 0.0001; // ~11m at Toronto's latitude
  const lngBuffer = 0.0001; // ~8m at Toronto's latitude

  const coordinates = [
    [lng - lngBuffer, lat - latBuffer],
    [lng + lngBuffer, lat - latBuffer],
    [lng + lngBuffer, lat + latBuffer],
    [lng - lngBuffer, lat + latBuffer],
    [lng - lngBuffer, lat - latBuffer],
  ];

  const geometry: GeoJSON.Polygon = {
    type: "Polygon",
    coordinates: [coordinates],
  };

  return {
    geometry,
    source,
    accuracy: "low",
    properties: {
      ...properties,
      buildingArea: calculatePolygonArea(geometry),
    },
  };
};

// Main function to get property boundary with fallbacks
export const getPropertyBoundary = async (
  lat: number,
  lng: number,
): Promise<PropertyBoundary> => {
  // Try OSM first (most detailed building outlines)
  let boundary = await getOSMBuildingBoundary(lat, lng);
  if (boundary) {
    console.log("Using OSM boundary data");
    return boundary;
  }

  // Try Toronto Open Data
  boundary = await getTorontoPropertyParcel(lat, lng);
  if (boundary) {
    console.log("Using Toronto Open Data");
    return boundary;
  }

  // Try Google enhanced geocoding
  boundary = await getGooglePropertyBoundary(lat, lng);
  if (boundary) {
    console.log("Using Google boundary data");
    return boundary;
  }

  // Fallback to buffer
  console.log("Using fallback boundary");
  return createBufferBoundary(lat, lng);
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

const inferPropertyTypeFromAddress = (
  result: GoogleGeocodingResult,
): string => {
  const types = result.types || [];

  if (types.includes("premise")) return "residential";
  if (types.includes("establishment")) return "commercial";
  if (types.includes("subpremise")) return "residential";

  return "unknown";
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
