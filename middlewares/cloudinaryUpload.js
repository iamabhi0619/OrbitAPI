const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const streamifier = require('streamifier');

const cloudinaryUpload = (options = {}) => {
  const {
    folder = 'uploads',
    allowedFormats = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'mp4', 'mov', 'webm'],
    resourceType = 'image',
    fileField = 'file',
    maxFileSize = 5 * 1024 * 1024,
    transformations = [],
  } = options;

  // ---- Multer v2.x config (memory storage) ----
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxFileSize },

    // Multer 2.x: fileFilter must RETURN true/false instead of cb()
    fileFilter(req, file) {
      const ext = file.mimetype.split('/').pop().toLowerCase();

      if (!allowedFormats.includes(ext)) {
        logger.warn(`Rejected file type: ${file.mimetype}`);
        throw new ApiError(
          400,
          'Invalid file type',
          'INVALID_FILE',
          `Only [${allowedFormats.join(', ')}] formats are allowed.`
        );
      }

      return true;
    }
  }).single(fileField);

  // ---- Our final middleware wrapper ----
  return (req, res, next) => {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        let message = err.message;

        if (err.code === 'LIMIT_FILE_SIZE') {
          message = `File too large. Max allowed size: ${maxFileSize / (1024 * 1024)}MB`;
        }

        logger.error(`Multer error: ${message}`);
        return next(new ApiError(400, 'File upload error', 'UPLOAD_FAILED', message));
      }

      if (err instanceof ApiError) {
        logger.warn(`Custom upload error: ${err.message}`);
        return next(err);
      }

      if (err) {
        logger.error(`Unexpected upload error: ${err.message}`);
        return next(new ApiError(500, 'Unexpected upload error', 'UPLOAD_ERROR', err.message));
      }

      if (!req.file) {
        return next(); // no file uploaded → continue
      }

      // ---- Upload to Cloudinary manually (because no storage engine in Multer 2.x) ----
      try {
        const uploadStream = await new Promise((resolve, reject) => {
          const cloudinaryStream = cloudinary.uploader.upload_stream(
            {
              folder,
              resource_type: resourceType,
              allowed_formats: allowedFormats,
              transformation: transformations.length > 0 ? transformations : undefined,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );

          streamifier.createReadStream(req.file.buffer).pipe(cloudinaryStream);
        });

        req.file.cloudinary = uploadStream; // attach Cloudinary response
        next();

      } catch (cloudErr) {
        logger.error(`Cloudinary upload failed: ${cloudErr.message}`);
        return next(new ApiError(500, 'Failed to upload to Cloudinary', 'CLOUDINARY_ERROR', cloudErr.message));
      }
    });
  };
};

module.exports = cloudinaryUpload;
