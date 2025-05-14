const express = require("express");

const router = express.Router();

const {
  createProject,
  getAllProject,
  getSingleProject,
  updateProject,
  deleteProject,
  getSummery,
  addUserReview,
  markReviewAsImportant,
  deleteUserReview,
  uplodeSS,
} = require("../controllers/project");
const { verifyToken, isAdmin } = require("../middleware/auth");
const { uploadProjectScreenshot } = require("../middleware/upload");

// Create Project
router.post("/", verifyToken, isAdmin, createProject);

// Get All Projects
router.get("/", getAllProject);

//Get Summery of the project
router.get("/summery", verifyToken, isAdmin, getSummery);

// Get Single Project by ID
router.get("/:id", getSingleProject);

// Update Project
router.put("/:id", verifyToken, isAdmin, updateProject);

// Delete Project
router.delete("/:id", verifyToken, isAdmin, deleteProject);

router.post("/:projectId/review", addUserReview);
router.put("/:projectId/review/:reviewId/important", markReviewAsImportant);
router.delete("/:projectId/review/:reviewId", verifyToken, deleteUserReview);
router.post(
  "/uplodeSS",
  verifyToken,
  isAdmin,
  uploadProjectScreenshot.single("screenshots"),
  uplodeSS
);

module.exports = router;
