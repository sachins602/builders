import fs from "fs";
import path from "path";
import { env } from "~/env";
import { UTApi } from "uploadthing/server";

interface UploadResult {
  url: string;
  success: boolean;
  storageType: "local" | "cloud";
  error?: string;
}

export class StorageService {
  private static utapi = env.UPLOADTHING_TOKEN ? new UTApi() : null;

  private static isCloudEnvironment(): boolean {
    return env.ENVIRONMENT === "cloud";
  }

  /**
   * Saves a base64 image either locally or to UploadThing based on environment
   * @param base64Data - Base64 encoded image data
   * @param fileName - Name for the file
   * @param type - Type of image (streetview or generated)
   * @returns Promise<UploadResult>
   */
  static async saveBase64Image(
    base64Data: string,
    fileName: string,
    type: "streetview" | "generated",
  ): Promise<UploadResult> {
    try {
      if (this.isCloudEnvironment()) {
        return await this.saveToUploadThing(base64Data, fileName, type);
      } else {
        return await this.saveLocally(base64Data, fileName, type);
      }
    } catch (error) {
      return {
        url: "",
        success: false,
        storageType: this.isCloudEnvironment() ? "cloud" : "local",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Saves a buffer (e.g. from fetch response) either locally or to UploadThing
   * @param buffer - Image buffer data
   * @param fileName - Name for the file
   * @param type - Type of image (streetview or generated)
   * @returns Promise<UploadResult>
   */
  static async saveBufferImage(
    buffer: ArrayBuffer,
    fileName: string,
    type: "streetview" | "generated",
  ): Promise<UploadResult> {
    try {
      if (this.isCloudEnvironment()) {
        return await this.saveBufferToUploadThing(buffer, fileName, type);
      } else {
        return await this.saveBufferLocally(buffer, fileName, type);
      }
    } catch (error) {
      return {
        url: "",
        success: false,
        storageType: this.isCloudEnvironment() ? "cloud" : "local",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private static async saveToUploadThing(
    base64Data: string,
    fileName: string,
    type: "streetview" | "generated",
  ): Promise<UploadResult> {
    if (!this.utapi) {
      throw new Error("UploadThing not configured - UPLOADTHING_TOKEN missing");
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, "base64");

    // Create File object from buffer
    const file = new File([buffer], `${fileName}.jpg`, { type: "image/jpeg" });

    const response = await this.utapi.uploadFiles(file);

    if (response.data) {
      return {
        url: response.data.url,
        success: true,
        storageType: "cloud",
      };
    }

    if (response.error) {
      throw new Error(`UploadThing error: ${response.error.message}`);
    }

    throw new Error("Failed to upload to UploadThing");
  }

  private static async saveBufferToUploadThing(
    buffer: ArrayBuffer,
    fileName: string,
    type: "streetview" | "generated",
  ): Promise<UploadResult> {
    if (!this.utapi) {
      throw new Error("UploadThing not configured - UPLOADTHING_TOKEN missing");
    }

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
        storageType: "cloud",
      };
    }

    if (response.error) {
      throw new Error(`UploadThing error: ${response.error.message}`);
    }

    throw new Error("Failed to upload to UploadThing");
  }

  private static async saveLocally(
    base64Data: string,
    fileName: string,
    type: "streetview" | "generated",
  ): Promise<UploadResult> {
    const fileType = "jpg";
    const directory =
      type === "streetview" ? "streetviewimages" : "generatedimages";

    // Ensure the directory exists
    const targetDir = path.join(process.cwd(), "public", directory);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, `${fileName}.${fileType}`);

    // Write the file using Buffer to properly handle base64 data
    fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));

    return {
      url: `/${directory}/${fileName}.${fileType}`,
      success: true,
      storageType: "local",
    };
  }

  private static async saveBufferLocally(
    buffer: ArrayBuffer,
    fileName: string,
    type: "streetview" | "generated",
  ): Promise<UploadResult> {
    const fileType = "jpg";
    const directory =
      type === "streetview" ? "streetviewimages" : "generatedimages";

    // Ensure the directory exists
    const targetDir = path.join(process.cwd(), "public", directory);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, `${fileName}.${fileType}`);

    // Write the file
    const arrayBuffer = new Uint8Array(buffer);
    fs.writeFileSync(filePath, arrayBuffer);

    return {
      url: `/${directory}/${fileName}.${fileType}`,
      success: true,
      storageType: "local",
    };
  }

  /**
   * Gets the full file path for local storage (used for OpenAI API calls)
   * For cloud storage, this returns null as we can't access cloud files locally
   */
  static getLocalFilePath(url: string): string | null {
    if (this.isCloudEnvironment()) {
      return null; // Can't access cloud files locally
    }

    return path.join(process.cwd(), "public", url);
  }

  /**
   * Checks if a file exists (only for local storage)
   */
  static fileExists(url: string): boolean {
    if (this.isCloudEnvironment()) {
      return true; // Assume cloud files exist
    }

    const fullPath = this.getLocalFilePath(url);
    return fullPath ? fs.existsSync(fullPath) : false;
  }
}
