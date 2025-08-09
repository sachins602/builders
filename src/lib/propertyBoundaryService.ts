export interface PropertyBoundary {
  geometry: GeoJSON.Polygon;
  properties: {
    osmId: string;
    buildingType: string;
    propertyType: string;
    address?: string;
    buildingArea?: number;
  };
}

export type PropertyBoundaryErrorCode =
  | "OSM_API_ERROR"
  | "NO_BUILDINGS_FOUND"
  | "NO_GEOMETRY_ON_CLOSEST_BUILDING"
  | "OSM_QUERY_FAILED"
  | "UNKNOWN_ERROR";

export type PropertyBoundaryResult =
  | { ok: true; boundary: PropertyBoundary }
  | {
      ok: false;
      code: PropertyBoundaryErrorCode;
      message: string;
      status?: number;
    };

interface OSMElement {
  id: number;
  type: "way" | "relation" | "node";
  geometry?: Array<{ lat: number; lon: number }>;
  tags?: Record<string, string>;
}

// Get property boundary from OpenStreetMap
export const getPropertyBoundary = async (
  lat: number,
  lng: number,
): Promise<PropertyBoundaryResult> => {
  try {
    // Query OSM for buildings within 50m of the clicked point
    const query = `
      [out:json][timeout:25];
      (
        way["building"](around:50,${lat},${lng});
        relation["building"](around:50,${lat},${lng});
      );
      out geom;
    `;

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      const status = response.status;
      const message = `OSM API error: ${status}`;
      console.error(message);
      return { ok: false, code: "OSM_API_ERROR", message, status };
    }

    const data = (await response.json()) as { elements: OSMElement[] };

    if (!data.elements?.length) {
      const message = "No buildings found at this location.";
      console.log(message);
      return { ok: false, code: "NO_BUILDINGS_FOUND", message };
    }

    // Find the closest building
    let closestBuilding: OSMElement | null = null;
    let minDistance = Infinity;

    for (const element of data.elements) {
      if (element.type === "way" && element.geometry) {
        // Calculate center of building
        const coords = element.geometry;
        const centerLat =
          coords.reduce((sum, c) => sum + c.lat, 0) / coords.length;
        const centerLng =
          coords.reduce((sum, c) => sum + c.lon, 0) / coords.length;

        // Simple distance calculation
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
      return {
        ok: false,
        code: "NO_GEOMETRY_ON_CLOSEST_BUILDING",
        message: "Unable to determine building geometry at this location.",
      };
    }

    // Convert to GeoJSON polygon
    const coordinates = closestBuilding.geometry.map(
      (coord) => [coord.lon, coord.lat] as [number, number],
    );

    // Ensure polygon is closed
    if (
      coordinates.length > 0 &&
      (coordinates[0]![0] !== coordinates[coordinates.length - 1]![0] ||
        coordinates[0]![1] !== coordinates[coordinates.length - 1]![1])
    ) {
      coordinates.push(coordinates[0]!);
    }

    // Extract property information
    const tags = closestBuilding.tags ?? {};
    const buildingType = tags.building ?? "yes";

    return {
      ok: true,
      boundary: {
        geometry: {
          type: "Polygon",
          coordinates: [coordinates],
        },
        properties: {
          osmId: closestBuilding.id.toString(),
          buildingType,
          propertyType: getPropertyType(buildingType),
          address: formatAddress(tags),
          buildingArea: calculateArea(coordinates),
        },
      },
    };
  } catch (error) {
    const message = `Error fetching OSM data: ${
      error instanceof Error ? error.message : String(error)
    }`;
    console.error(message);
    return { ok: false, code: "UNKNOWN_ERROR", message };
  }
};

// Simplified property type detection
function getPropertyType(buildingType: string): string {
  const residential = ["house", "detached", "apartments", "residential"];
  const commercial = ["commercial", "office", "retail", "shop"];

  if (residential.some((type) => buildingType.includes(type)))
    return "residential";
  if (commercial.some((type) => buildingType.includes(type)))
    return "commercial";
  return "other";
}

// Format address from OSM tags
function formatAddress(tags: Record<string, string>): string | undefined {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:city"],
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" ") : undefined;
}

// Simple area calculation (approximate)
function calculateArea(coords: [number, number][]): number {
  if (coords.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    area +=
      coords[i]![0] * coords[i + 1]![1] - coords[i + 1]![0] * coords[i]![1];
  }

  // Convert to approximate square meters (very rough approximation)
  return Math.abs(area / 2) * 111320 * 111320;
}
