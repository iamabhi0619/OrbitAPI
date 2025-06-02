const express = require("express");
const router = express.Router();

router.use("/word", require('./word'))
router.use("/scorecard", require('./score'));

module.exports = router;
