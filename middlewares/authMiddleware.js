const jwt = require("jsonwebtoken");
const config = require("../config");
const ApiError = require("../utils/ApiError");
const logger = require("../config/logger");
const redis = require("../config/redis");
const User = require("../model/user");

// Middleware to verify JWT token

const verifyToken = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return next(new ApiError(401, "Access denied", "TOKEN_REQUIRED", "Access denied. Token required."));
        }
        const decoded = jwt.verify(token, config.SECRET);
        if (decoded.sessionId) {
            const redisSessionId = await redis.get(`user:${decoded.userId}:session`);
            if (!redisSessionId) {
                throw new ApiError(401, "Session expired", "SESSION_EXPIRED", "Session has expired. Please log in again.");
            }
            if (redisSessionId !== decoded.sessionId) {
                throw new ApiError(401, "Invalid session", "INVALID_SESSION", "Invalid session. Please log in again.");
            }
            const user = await User.findById(decoded.userId);
            if (!user) {
                throw new ApiError(404, "User not found", "USER_NOT_FOUND", "User associated with this token no longer exists.");
            }
            req.user = user;
            next();
        } else {
            const token = req.header("Authorization")?.replace("Bearer ", "");
            if (!token) {
                throw new ApiError(401, "Access denied", "TOKEN_REQUIRED", "Access denied. Token required.");
            }
            const decoded = jwt.verify(token, config.SECRET);
            // console.log(decoded)
            req.user = decoded;
            next();
        }
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            throw new ApiError(401, "Invalid token", "INVALID_TOKEN", "Invalid token.");
        }
        if (error.name === "JsonWebTokenError") {
            throw new ApiError(401, "Invalid token", "INVALID_TOKEN", "Invalid token.");
        }
        if (error instanceof ApiError) {
            return next(error);
        }
        logger.error("Error verifying token:", error);
        next(new ApiError(500, "Internal server error", "TOKEN_VERIFICATION_ERROR", "An error occurred while verifying the token."));
    }
}


const oldToken = (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            throw new ApiError(401, "Access denied", "TOKEN_REQUIRED", "Access denied. Token required.");
        }
        const decoded = jwt.verify(token, config.SECRET);
        req.user = { _id: decoded.userId };
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            throw new ApiError(401, "Invalid token", "INVALID_TOKEN", "Invalid token.");
        }
        if (error.name === "JsonWebTokenError") {
            throw new ApiError(401, "Invalid token", "INVALID_TOKEN", "Invalid token.");
        }
    }
};

// Middleware to check if the user is an admin
const isAdmin = (req, res, next) => {
    try {
        if (req.user.role !== "admin") {
            logger.warn(`User with userId: ${req.user._id} attempted to access an admin route.`);
            return next(new ApiError(403, "Access denied", "ADMIN_ONLY", "Access denied. Admins only."));
        }
        next();
    } catch (error) {
        logger.error("Error checking admin role:", error);
        next(new ApiError(500, "Internal server error", "ROLE_CHECK_ERROR", "An error occurred while checking user role."));
    }
};

module.exports = { verifyToken, isAdmin };
