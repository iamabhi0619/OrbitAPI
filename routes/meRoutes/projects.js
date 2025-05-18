const express = require('express');
const { createProject, getAllProject, getSingleProject, updateProject, deleteProject, getSummery, uploadScreenshot, addUserReview, markReviewAsImportant, deleteUserReview, getSingleProjectReviews, getAllReviews } = require('../../controllers/me/meProject');
const cloudinaryUpload = require('../../middlewares/cloudinaryUpload');
const CLOUDINARY_UPLOAD_TYPES = require('../../utils/cloudinaryUploadTypes');
const router = express.Router();


router.post("/", createProject);
router.get("/", getAllProject);
router.get("/reviews", getAllReviews);
router.get("/reviews/:id", getSingleProjectReviews);
router.get("/:id", getSingleProject);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

// Summary
router.get("/summary/info", getSummery);

// Upload Screenshot
router.post("/upload-screenshot", cloudinaryUpload(CLOUDINARY_UPLOAD_TYPES.PROJECT_SCREENSHOT), uploadScreenshot);

// User Reviews
router.post("/:projectId/reviews", addUserReview);
router.patch("/:projectId/reviews/:reviewId/important", markReviewAsImportant);
router.delete("/:projectId/reviews/:reviewId", deleteUserReview);

module.exports = router;