const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../middleware/auth");

const {
  createContactMessage,
  getAllMessages,
  getSingleMessage,
  updateMessage,
  deleteMessage,
  replyToMessage,
} = require("../controllers/contact");

// 📌 POST: Create Contact Message
router.post("/", createContactMessage);
router.get("/", verifyToken, isAdmin, getAllMessages);
router.get("/:id", verifyToken, isAdmin, getSingleMessage);
router.put("/:id", verifyToken, isAdmin, updateMessage);
router.put("/:id/reply", verifyToken, isAdmin, replyToMessage);
router.delete("/:id", verifyToken, isAdmin, deleteMessage);

module.exports = router;
