const express = require("express");
const { verifyToken } = require("../../middlewares/authMiddleware");
const GTWScorecard = require("../../controllers/GuessTheWord/score");
const router = express.Router();

router.get("/", verifyToken, GTWScorecard.getScorecard);
router.post("/", verifyToken, GTWScorecard.createScorecard);
router.get("/random-word", verifyToken, GTWScorecard.getRandomWord);

module.exports = router;
