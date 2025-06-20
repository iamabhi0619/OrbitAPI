const jwt = require("jsonwebtoken");
const config = require("../config");
const ApiError = require("../utils/ApiError");
const logger = require("../config/logger");

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return next(new ApiError(401, "Access denied", "TOKEN_REQUIRED", "Access denied. Token required."));
        }
        const decoded = jwt.verify(token, config.SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            next(new ApiError(401, "Invalid token", "INVALID_TOKEN", "Invalid token."));
        }
        else if (error.name === "JsonWebTokenError") {
            next(new ApiError(401, "Invalid token", "INVALID_TOKEN", "Invalid token."));
        } else {
            logger.error("Error verifying token:", error);
            next(new ApiError(500, "Internal server error", "TOKEN_VERIFICATION_ERROR", "An error occurred while verifying the token."));
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

const issueToken = () => {

}

module.exports = { verifyToken, isAdmin };
