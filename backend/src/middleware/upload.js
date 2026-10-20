import multer from "multer";
import { ApiError } from "../utils/ApiError.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        `Invalid file type "${file.mimetype}". Only JPG, PNG, and WEBP images are allowed.`
      ),
      false
    );
  }
};

const multerInstance = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  }
});

export const uploadAttachments = multerInstance.array("attachments", 5);
export const uploadProofPhoto = multerInstance.single("proofPhoto");

/**
 * Uploads an array of multer memory files to Cloudinary
 * @param {Array} files 
 * @param {string} folder 
 * @returns {Promise<Array<{url: string, publicId: string, uploadedAt: Date}>>}
 */
export const processUploadsToCloudinary = async (files = [], folder = "complaints") => {
  if (!files || files.length === 0) return [];

  const uploadPromises = files.map(async (file, index) => {
    const filename = `file_${Date.now()}_${index}`;
    const result = await uploadToCloudinary(file.buffer, folder, filename);
    return {
      url: result.url,
      publicId: result.publicId,
      uploadedAt: new Date()
    };
  });

  return Promise.all(uploadPromises);
};

/**
 * Cleans up uploaded Cloudinary assets if subsequent DB operations fail
 * @param {Array<{publicId: string}>} assets 
 */
export const cleanupUploadedAssets = async (assets = []) => {
  if (!assets || assets.length === 0) return;
  const deletions = assets.map((asset) => {
    if (asset?.publicId) {
      return deleteFromCloudinary(asset.publicId);
    }
    return Promise.resolve();
  });
  await Promise.allSettled(deletions);
};
