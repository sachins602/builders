
import { Marker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '~/trpc/react';

// Define the expected shape of the image data from the API
interface ImageDataFromApi {
  id: number; // Or string, depending on your schema
  url: string;
  name?: string | null;
  lat?: number | null;
  lng?: number | null;
}

// Define the shape of the image data after filtering, where lat/lng are guaranteed numbers
interface ValidatedImageData extends ImageDataFromApi {
  lat: number;
  lng: number;
  url: string; // url is also guaranteed by the filter
}

export default function ImagePopup() {
  const imagesQuery = api.response.getImages.useQuery();


  const typedImages = imagesQuery.data as ImageDataFromApi[] | undefined;

  // Filter and type guard to ensure lat, lng, and url are present and correctly typed.
  // The type predicate ': image is ValidatedImageData' helps TypeScript understand the shape.
  const filteredAndValidatedImages: ValidatedImageData[] = typedImages?.filter(
    (image): image is ValidatedImageData =>
      typeof image.lat === 'number' &&
      typeof image.lng === 'number' &&
      typeof image.url === 'string' && // Ensure URL is a string and not null/undefined
      image.url.trim() !== '' // Ensure URL is not an empty string
  ) ?? []; // Default to an empty array if typedImages is undefined or null

  if (filteredAndValidatedImages.length === 0) {
    return <p>No images to display.</p>;
  }

  return filteredAndValidatedImages.map((image) => {
    // Now, image.lat and image.lng are correctly typed as 'number'
    // and image.url is 'string' due to the ValidatedImageData type and filter.
    return (
      <Marker key={image.id} position={[image.lat, image.lng]}>
        <Tooltip permanent={true} direction="top" offset={[0, -10]}>
          <img
            src={`/${image.url}`}
            alt={image.name ?? 'Street View Image'}
            style={{ maxWidth: '100px', maxHeight: '80px', display: 'block', margin: 'auto' }} // Added styling for image size and centering
          />
          {image.name && <p style={{ textAlign: 'center' }}>{image.name}</p>}
        </Tooltip>
      </Marker>
    );
  });
}