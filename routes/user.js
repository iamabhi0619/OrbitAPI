const express = require("express");

const router = express.Router();
const {
  getProfile,
  updateProfile,
  deleteUser,
  getLoginHistory,
  getActivityLog,
  updateSettings,
  searchUser,
} = require("../controllers/user");
const { verifyToken, isAdmin } = require("../middleware/auth");
const { getAllUsersAdmin } = require("../controllers/userAdmin");

// Public Routes
router.get("/search", searchUser);

// Authenticated Routes (For Regular Users)
router.get("/me", verifyToken, getProfile);
router.put("/me", verifyToken, updateProfile);
router.delete("/me", verifyToken, deleteUser);
router.get("/profile/login-history", verifyToken, getLoginHistory);
router.get("/profile/activity-log", verifyToken, getActivityLog); // Added verifyToken middleware
router.put("/profile/settings", verifyToken, updateSettings);

// Admin Routes (Protected with Admin Middleware)
router.get("/admin/users", verifyToken, isAdmin, getAllUsersAdmin);
// router.get("/admin/summary",verifyToken, isAdmin, getSummary);

module.exports = router;
