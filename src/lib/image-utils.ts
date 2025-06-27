/**
 * Utility function to get the correct image URL for both local and cloud storage
 * @param url - The image URL from the database
 * @returns The properly formatted URL for displaying the image
 */
export function getImageUrl(url: string): string {
  // If the URL already starts with http:// or https://, it's a cloud URL
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // If the URL starts with a slash, it's already a properly formatted local path
  if (url.startsWith("/")) {
    return url;
  }

  // Otherwise, it's a local path that needs a leading slash
  return `/${url}`;
}
