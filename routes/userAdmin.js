const express = require("express");
const { getUserSummary } = require("../controllers/userAdmin");
const { verifyToken, isAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/summery", verifyToken, isAdmin, getUserSummary);

module.exports = router;
