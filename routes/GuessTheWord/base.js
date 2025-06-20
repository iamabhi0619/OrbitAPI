const express = require("express");
const router = express.Router();

router.use("/word", require('./word'))
router.use("/me", require('./user'));
router.use("/leaderboard", require('./leaderboard'));

module.exports = router;
