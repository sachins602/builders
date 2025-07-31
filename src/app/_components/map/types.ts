// Types
export type NominatimResult = {
  lat: string;
  lon: string;
  [key: string]: string;
};

export type PropertyData = {
  id: number;
  address: string | null;
  buildingType?: string | null;
  buildingArea?: number | null;
  propertyType?: string | null;
  imageUrl: string;
  propertyBoundary?: {
    coordinates: number[][][];
  } | null;
};

export type NearbyImage = {
  id: number;
  url: string;
  address: string | null;
};

// Constants
export const TORONTO_CENTER: [number, number] = [43.7, -79.42];
export const INITIAL_ZOOM = 11;
export const ZOOM_LIMIT = 18;

export const outerBounds: [number, number][][] = [
  [
    [90, -180],
    [90, 180],
    [-90, 180],
    [-90, -180],
  ],
];
