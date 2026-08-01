import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export function isConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export function uploadImage(buffer: Buffer, publicId?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadOptions = publicId ? { folder: "roxson", public_id: publicId } : { folder: "roxson" };
    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) return reject(error);
      if (!result) return reject(new Error("Cloudinary returned no result"));
      resolve(result.secure_url);
    });
    stream.end(buffer);
  });
}

export async function deleteImage(url: string): Promise<void> {
  const match = url.match(/\/v\d+\/(.+)\.[a-zA-Z0-9]+$/);
  if (!match) return;
  const publicId = match[1];
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // ignore
  }
}
