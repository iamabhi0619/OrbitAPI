const logger = require("../../config/logger");
const User = require("../../model/user");
const ApiError = require("../../utils/ApiError");
const path = require("path");

// GET /api/me
exports.getOwnData = async (req, res, next) => {
    try {
        if (!req.user || !req.user._id) {
            return next(new ApiError(401, "Unauthorized", "UNAUTHORIZED", "User authentication required."));
        }
        const user = await User.findById(req.user._id)
            .select('-password -activityLog -servicesAvailed -loginHistory -role -__v -resetPasswordToken -resetPasswordExpires -emailVerificationToken');
        if (!user) {
            return next(new ApiError(404, "User not found", "USER_NOT_FOUND", "The provided user does not exist in our records."));
        }
        res.status(200).json({
            success: true,
            message: "User data fetched successfully.",
            user
        });
    } catch (error) {
        if (error.name === "CastError") {
            return next(new ApiError(400, "Invalid user ID", "INVALID_USER_ID", error.message));
        }
        logger.error("Failed to fetch user data: " + error.message);
        next(new ApiError(500, "Failed to fetch user data", "INTERNAL_ERROR", "An unexpected error occurred."));
    }
};

// PUT /api/me
exports.updateUser = async (req, res, next) => {
    try {
        if (!req.user || !req.user._id) {
            return next(new ApiError(401, "Unauthorized", "UNAUTHORIZED", "User authentication required."));
        }
        const updates = { ...req.body };
        delete updates.password; // Prevent password update here

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        ).select('-password -activityLog -servicesAvailed -loginHistory -role');

        if (!user) {
            return next(new ApiError(404, "User not found", "USER_NOT_FOUND", "The provided user does not exist in our records."));
        }
        res.status(200).json({
            success: true,
            message: "User updated successfully.",
            user
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return next(new ApiError(400, "Invalid data", "INVALID_DATA", error.message));
        }
        logger.error("Failed to update user: " + error.message);
        next(new ApiError(500, "Failed to update user", "INTERNAL_ERROR", "An unexpected error occurred."));
    }
};

// DELETE /api/me/:id
exports.deleteUser = async (req, res, next) => {
    try {
        if (!req.user || !req.user._id) {
            return next(new ApiError(401, "Unauthorized", "UNAUTHORIZED", "User authentication required."));
        }
        // Only allow self-delete or admin (add admin check as needed)
        if (req.user._id !== req.params.id && req.user.role !== 'admin') {
            return next(new ApiError(403, "Forbidden", "FORBIDDEN", "You are not allowed to delete this user."));
        }
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return next(new ApiError(404, "User not found", "USER_NOT_FOUND"));
        }
        res.status(200).json({
            success: true,
            message: "User deleted successfully."
        });
    } catch (error) {
        if (error.name === "CastError") {
            return next(new ApiError(400, "Invalid user ID", "INVALID_USER_ID", error.message));
        }
        logger.error("Failed to delete user: " + error.message);
        next(new ApiError(500, "Failed to delete user", "INTERNAL_ERROR", "An unexpected error occurred."));
    }
};

// GET /api/me/login-history
exports.getLoginHistory = async (req, res, next) => {
    try {
        if (!req.user || !req.user._id) {
            return next(new ApiError(401, "Unauthorized", "UNAUTHORIZED", "User authentication required."));
        }
        const user = await User.findById(req.user._id).select('loginHistory');
        if (!user) {
            return next(new ApiError(404, "User not found", "USER_NOT_FOUND"));
        }
        res.status(200).json({
            success: true,
            message: "Login history fetched successfully.",
            loginHistory: user.loginHistory || []
        });
    } catch (error) {
        if (error.name === "CastError") {
            return next(new ApiError(400, "Invalid user ID", "INVALID_USER_ID", error.message));
        }
        logger.error("Failed to fetch login history: " + error.message);
        next(new ApiError(500, "Failed to fetch login history", "INTERNAL_ERROR", "An unexpected error occurred."));
    }
};

// GET /api/me/settings
exports.getUserSettings = async (req, res, next) => {
    try {
        if (!req.user || !req.user._id) {
            return next(new ApiError(401, "Unauthorized", "UNAUTHORIZED", "User authentication required."));
        }
        const user = await User.findById(req.user._id).select("settings");
        if (!user) {
            return next(new ApiError(404, "User not found", "USER_NOT_FOUND", "The provided user does not exist in our records."));
        }
        res.status(200).json({
            success: true,
            message: "User settings fetched successfully.",
            settings: user.settings || {}
        });
    } catch (error) {
        if (error.name === "CastError") {
            return next(new ApiError(400, "Invalid user ID", "INVALID_USER_ID", error.message));
        }
        logger.error("Failed to get user settings: " + error.message);
        next(new ApiError(500, "Failed to get user settings", "INTERNAL_ERROR", "An unexpected error occurred."));
    }
};

// POST /api/me/avatar
exports.userAvatarUpdate = async (req, res, next) => {
    try {
        if (!req.user || !req.user._id) {
            return next(new ApiError(401, "Unauthorized", "UNAUTHORIZED", "User authentication required."));
        }
        if (!req.file || !req.file.path) {
            return next(new ApiError(400, "No file uploaded", "NO_FILE", "Please upload a valid image file."));
        }

        // Example: Save the file path or URL to user's avatar field
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { avatar: req.file.path },
            { new: true, runValidators: true }
        ).select('-password -activityLog -servicesAvailed -loginHistory -role');

        if (!user) {
            return next(new ApiError(404, "User not found", "USER_NOT_FOUND", "The provided user does not exist in our records."));
        }

        res.status(200).json({
            success: true,
            message: "Profile picture updated successfully.",
            avatar: user.avatar
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return next(new ApiError(400, "Invalid data", "INVALID_DATA", error.message));
        }
        logger.error("Failed to update profile picture: " + error.message);
        next(new ApiError(500, "Failed to update profile picture", "INTERNAL_ERROR", "An unexpected error occurred."));
    }
};
