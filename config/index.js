require('dotenv').config();

module.exports = {
    DB_URL: process.env.DB_URL || "mongodb://localhost:27017/main",
    SECRET: process.env.SECRET,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN || '8189974621:AAHWNBVT6WSx9XA684pWPTeksrZf2KMnyn4',
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '5671345486',
    CLIENT_URL: process.env.CLIENT_URL,
    PORT: process.env.PORT || 5050,
    NODE_ENV: process.env.NODE_ENV || "development",
    REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || "30d",
    JWT_EXPIRATION: process.env.JWT_EXPIRATION || "10m",
    DOMAIN: process.env.DOMAIN,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
};