const express = require('express');
const {
    createProject,
    getAllProject,
    getSingleProject,
    updateProject,
    deleteProject,
    getSummery,
    uploadScreenshot,
    addUserReview,
    markReviewAsImportant,
    deleteUserReview,
    getSingleProjectReviews,
    getAllReviews
} = require('../../controllers/me/meProject');
const cloudinaryUpload = require('../../middlewares/cloudinaryUpload');
const CLOUDINARY_UPLOAD_TYPES = require('../../utils/cloudinaryUploadTypes');
const { verifyToken, isAdmin } = require('../../middlewares/authMiddleware');
const router = express.Router();


// Main CRUD routes
router.post("/", verifyToken, isAdmin, createProject);
router.get("/", getAllProject);
router.get("/reviews", getAllReviews);
router.get("/reviews/:id", getSingleProjectReviews);
router.get("/:id", getSingleProject);
router.put("/:id", verifyToken, isAdmin, updateProject);
router.delete("/:id", verifyToken, isAdmin, deleteProject);

// Summary
router.get("/summary/info", verifyToken, isAdmin, getSummery);

// Upload Screenshot
router.post("/upload-screenshot", verifyToken, isAdmin, cloudinaryUpload(CLOUDINARY_UPLOAD_TYPES.PROJECT_SCREENSHOT), uploadScreenshot);

// User Reviews
router.post("/:projectId/reviews", verifyToken, addUserReview);
router.patch("/:projectId/reviews/:reviewId/important", verifyToken, markReviewAsImportant);
router.delete("/:projectId/reviews/:reviewId", verifyToken, deleteUserReview);

module.exports = router;