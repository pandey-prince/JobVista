import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

export const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );

const getPublicBaseUrl = () =>
  process.env.API_BASE_URL ||
  process.env.BACKEND_URL ||
  `http://localhost:${process.env.PORT || 8000}`;

const uploadToCloudinary = (file, folder) =>
  new Promise((resolve, reject) => {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const resourceType = file.mimetype?.startsWith("image/") ? "image" : "raw";

    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      },
    );

    stream.end(file.buffer);
  });

const saveLocally = (file) => {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  const safeName = `${Date.now()}-${(file.originalname || "file").replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, safeName), file.buffer);
  return `${getPublicBaseUrl()}/uploads/${safeName}`;
};

export const uploadBuffer = async (file, folder = "jobvista") => {
  if (!file?.buffer?.length) return null;

  if (isCloudinaryConfigured()) {
    return uploadToCloudinary(file, folder);
  }

  return saveLocally(file);
};
