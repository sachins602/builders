import { UTApi } from "uploadthing/server";

interface UploadResult {
  url: string;
  success: boolean;
  error?: string;
}

export class StorageService {
  private static utapi = new UTApi();

  /**
   * Saves a base64 image to UploadThing
   * @param base64Data - Base64 encoded image data
   * @param fileName - Name for the file
   * @returns Promise<UploadResult>
   */
  static async saveBase64Image(
    base64Data: string,
    fileName: string,
  ): Promise<UploadResult> {
    try {
      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, "base64");

      // Create File object from buffer
      const file = new File([buffer], `${fileName}.jpg`, {
        type: "image/jpeg",
      });

      const response = await this.utapi.uploadFiles(file);

      if (response.data) {
        return {
          url: response.data.url,
          success: true,
        };
      }

      if (response.error) {
        throw new Error(`UploadThing error: ${response.error.message}`);
      }

      throw new Error("Failed to upload to UploadThing");
    } catch (error) {
      return {
        url: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Saves a buffer (e.g. from fetch response) to UploadThing
   * @param buffer - Image buffer data
   * @param fileName - Name for the file
   * @returns Promise<UploadResult>
   */
  static async saveBufferImage(
    buffer: ArrayBuffer,
    fileName: string,
  ): Promise<UploadResult> {
    try {
      // Convert ArrayBuffer to File
      const uint8Array = new Uint8Array(buffer);
      const file = new File([uint8Array], `${fileName}.jpg`, {
        type: "image/jpeg",
      });

      const response = await this.utapi.uploadFiles(file);

      if (response.data) {
        return {
          url: response.data.url,
          success: true,
        };
      }

      if (response.error) {
        throw new Error(`UploadThing error: ${response.error.message}`);
      }

      throw new Error("Failed to upload to UploadThing");
    } catch (error) {
      return {
        url: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
