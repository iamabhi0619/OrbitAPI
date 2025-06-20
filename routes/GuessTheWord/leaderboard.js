// Example: d:\MyProject\OrbitAPI\routes\GuessTheWord\leaderboard.js
const express = require("express");
const router = express.Router();
const leaderboard = require("../../controllers/GuessTheWord/leaderboard");

router.get("/global", leaderboard.globalLeaderboard);
router.get("/daily", leaderboard.dailyLeaderboard);
router.get("/custom", leaderboard.customLeaderboard);

module.exports = router;