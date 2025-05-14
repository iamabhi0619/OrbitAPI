const express = require("express");
const {
  createNewsletter,
  sendNewsletter,
  getSubscribers,
  getAllNewsletters,
  getSingleNewsletters,
  updateNewsletter,
  deleteNewsletter,
  getNewslettersByType,
  getSummery,
} = require("../controllers/newsletterController");
const router = express.Router();
const { verifyToken, isAdmin } = require("../middleware/auth");

// Subscribers
router.get("/subscribers", verifyToken, isAdmin, getSubscribers);

// Newsletters
router.post("/create", verifyToken, isAdmin, createNewsletter);
router.post("/send/:id", verifyToken, isAdmin, sendNewsletter);
router.get("/", verifyToken, isAdmin, getAllNewsletters);
router.get("/summery", verifyToken, isAdmin, getSummery);
router.get("/type/:type", verifyToken, isAdmin, getNewslettersByType);
router.get("/:id", verifyToken, isAdmin, getSingleNewsletters);
router.put("/:id", verifyToken, isAdmin, updateNewsletter);
router.delete("/:id", verifyToken, isAdmin, deleteNewsletter);

module.exports = router;
