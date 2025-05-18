const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger'); // Add logger

const cloudinaryUpload = (options = {}) => {
  const {
    folder = 'uploads',
    allowedFormats = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'mp4', 'mov', 'webm'],
    resourceType = 'image',
    fileField = 'file',
    maxFileSize = 5 * 1024 * 1024,
    transformations = [],
  } = options;

  // Configure Cloudinary storage
  const storage = new CloudinaryStorage({
    cloudinary,
    params: async () => ({
      folder,
      resource_type: resourceType,
      allowed_formats: allowedFormats,
      transformation: transformations.length > 0 ? transformations : undefined,
    }),
  });

  // Multer instance
  const upload = multer({
    storage,
    limits: { fileSize: maxFileSize },
    fileFilter: (req, file, cb) => {
      const ext = file.mimetype.split('/').pop().toLowerCase();
      if (!allowedFormats.includes(ext)) {
        logger.warn(`File upload rejected: Invalid file type (${file.mimetype})`);
        return cb(
          new ApiError(
            400,
            'Invalid file type',
            'INVALID_FILE',
            `Only [${allowedFormats.join(', ')}] formats are allowed.`
          )
        );
      }
      cb(null, true);
    },
  }).single(fileField);

  // Wrap multer in a middleware with error handling
  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // Multer-specific error (file too large, etc)
        let message = err.message;
        if (err.code === 'LIMIT_FILE_SIZE') {
          message = `File too large. Max allowed size is ${maxFileSize / (1024 * 1024)}MB.`;
        }
        logger.error(`Multer error during file upload: ${message}`);
        return next(new ApiError(400, 'File upload error', 'UPLOAD_FAILED', message));
      } else if (err instanceof ApiError) {
        // Our custom errors
        logger.warn(`Custom ApiError during file upload: ${err.message}`);
        return next(err);
      } else if (err) {
        // Other unexpected errors
        logger.error(`Unexpected error during file upload: ${err.message}`);
        return next(new ApiError(500, 'Unexpected error during file upload', 'UPLOAD_ERROR', err.message));
      }
      next();
    });
  };
};

module.exports = cloudinaryUpload;