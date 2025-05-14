import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import config from "../config/index.js";

// ✅ Cloudinary Configuration
cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});

// ✅ Multer Storage Configuration
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "certifications",
    access_mode: "public",
    format: async (req, file) => file.mimetype.split("/")[1], // Keep original format
    resource_type: "auto", // Supports images & PDFs
  },
});

const projectStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "projects",
    access_mode: "public",
    format: async (req, file) => file.mimetype.split("/")[1],
    resource_type: "auto",
  },
});

// ✅ Create Multer Upload Middleware
const upload = multer({ storage });
const uploadProjectScreenshot = multer({ storage: projectStorage });

export { upload, uploadProjectScreenshot };
