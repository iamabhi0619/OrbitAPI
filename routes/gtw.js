const express = require("express");
const {
  getProgress,
  getHistory,
  getWord,
  checkWord,
  getHint,
} = require("../controllers/gtw");
const { verifyToken } = require("../middleware/auth");
const router = express.Router();

router.get("/", verifyToken, getProgress);
router.get("/history", verifyToken, getHistory);
router.get("/word", verifyToken, getWord);
router.post("/check", verifyToken, checkWord);
router.get("/hint", verifyToken, getHint);

module.exports = router;
