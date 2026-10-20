import { v2 as cloudinary } from "cloudinary";
import { env } from "./env.js";

const isCloudinaryConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME &&
  env.CLOUDINARY_API_KEY &&
  env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET
  });
}

/**
 * Uploads a file buffer to Cloudinary using upload_stream,
 * or returns a fallback data URL if credentials are not configured.
 * 
 * @param {Buffer} buffer File buffer from Multer memoryStorage
 * @param {string} folder Destination folder
 * @param {string} filename Optional identifier
 * @returns {Promise<{url: string, publicId: string}>}
 */
export const uploadToCloudinary = (buffer, folder = "complaints", filename = "") => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured) {
      // In development fallback, create a safe data URI and mock publicId
      const base64 = buffer.toString("base64");
      const fakePublicId = `${folder}/${filename || Date.now()}_mock`;
      const mime = "image/jpeg"; // default fallback mime
      const dataUri = `data:${mime};base64,${base64}`;
      return resolve({
        url: dataUri,
        publicId: fakePublicId
      });
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        public_id: filename || undefined
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    );

    stream.end(buffer);
  });
};

/**
 * Removes an asset from Cloudinary
 * @param {string} publicId
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!isCloudinaryConfigured || !publicId || publicId.includes("_mock")) {
    return;
  }
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Failed to delete Cloudinary asset:", publicId, err.message);
  }
};

export default cloudinary;
