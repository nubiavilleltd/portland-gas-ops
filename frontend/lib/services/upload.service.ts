export class UploadService {
  static async uploadImage(file: File): Promise<string> {
    // later: S3 / Cloudinary / backend upload

    // TEMP MOCK:
    return URL.createObjectURL(file);
  }
}