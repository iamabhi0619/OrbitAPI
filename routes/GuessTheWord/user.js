const express = require("express");
const { verifyToken } = require("../../middlewares/authMiddleware");
const scorecard = require("../../controllers/GuessTheWord/scorecard");
const user = require("../../controllers/GuessTheWord/userWord")
const router = express.Router();

router.get("/scorecard", verifyToken, scorecard.getScorecard);
router.post("/scorecard", verifyToken, scorecard.createScorecard);
router.get("/get-random-word", verifyToken, user.getRandomWord);
router.post("/check", verifyToken, user.checkWordGuess);
router.get("/hint", verifyToken, user.useHint);
router.get("/skip", verifyToken, user.skipWord);

module.exports = router;
