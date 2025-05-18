

const CLOUDINARY_UPLOAD_TYPES = {
    AVATAR: {
        folder: 'avatars',
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        transformations: [{ width: 500, height: 500, crop: 'auto' }],
        resourceType: 'image',
        fileField: 'file',
        maxFileSize: 2 * 1024 * 1024,
    },

    RESUME: {
        folder: 'resumes',
        allowedFormats: ['pdf'],
        resourceType: 'raw',
        fileField: 'file',
        maxFileSize: 10 * 1024 * 1024,
    },

    EVENT_BANNER: {
        folder: 'event_banners',
        allowedFormats: ['jpg', 'jpeg', 'png'],
        resourceType: 'image',
        maxFileSize: 8 * 1024 * 1024,
    },

    BLOG_COVER: {
        folder: 'blog_covers',
        allowedFormats: ['jpg', 'jpeg', 'webp'],
        resourceType: 'image',
        transformations: [{ width: 1200, height: 600, crop: 'fill' }],
    },

    VIDEO_UPLOAD: {
        folder: 'videos',
        allowedFormats: ['mp4', 'webm', 'mov'],
        resourceType: 'video',
        maxFileSize: 50 * 1024 * 1024,
    },

    KYC_DOC: {
        folder: 'kyc_docs',
        allowedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
        resourceType: 'raw',
        maxFileSize: 5 * 1024 * 1024,
    },

    PROJECT_SCREENSHOT: {
        folder: 'project_screenshots',
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        resourceType: 'image',
        transformations: [{ width: 1920, height: 1080, crop: 'fit' }],
    },

    CERTIFICATE: {
        folder: 'certificates',
        allowedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
        resourceType: 'image',
        maxFileSize: 5 * 1024 * 1024,
    },
};

module.exports = CLOUDINARY_UPLOAD_TYPES;
