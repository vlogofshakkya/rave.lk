import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { config } from "@/config";

let configured = false;

export function getCloudinary() {
  if (!configured) {
    cloudinary.config({
      cloud_name: config.cloudinary.cloudName,
      api_key: config.cloudinary.apiKey,
      api_secret: config.cloudinary.apiSecret,
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}

export function cloudinaryReady() {
  return Boolean(
    config.cloudinary.cloudName &&
      config.cloudinary.apiKey &&
      config.cloudinary.apiSecret
  );
}

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

export async function uploadImage(
  file: File,
  folder = "rave-lk"
): Promise<UploadResult> {
  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await new Promise<{
    secure_url: string;
    public_id: string;
    width: number;
    height: number;
  }>((resolve, reject) => {
    getCloudinary()
      .uploader.upload_stream(
        {
          folder,
          resource_type: "image",
          // Cap stored resolution — event posters never need more than this,
          // and it keeps the free-tier storage from filling up.
          transformation: [{ width: 2400, height: 2400, crop: "limit" }],
        },
        (err, res) => {
          if (err || !res) reject(err ?? new Error("Upload failed"));
          else resolve(res as never);
        }
      )
      .end(buffer);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
  };
}

export async function deleteImage(publicId: string) {
  if (!publicId) return;
  try {
    await getCloudinary().uploader.destroy(publicId);
  } catch {
    // A failed remote delete must not block removing the DB row.
  }
}
