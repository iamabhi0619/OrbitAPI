const express = require("express");
const router = express.Router();

const { leetCode, github, leetProfile, githubProfile } = require("../controllers/achievement");

// 📌 GET: LeetCode Stats

router.get("/leetcode", leetCode);
router.get("/github", github);
router.get("/github/:username", githubProfile);
router.get("/leetProfile/:id", leetProfile);

module.exports = router;
