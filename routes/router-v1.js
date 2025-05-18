const express = require("express");
const { sensitiveLimiter } = require("../config/rate-limiter");
const router = express.Router();

router.use("/auth", sensitiveLimiter, require("./userRoutes/authRoutes"));
router.use("/user/me", require("./userRoutes/meRoutes"));
router.use("/me", require("./meRoutes"));
router.use("/logs", require("./logRoutes"));
router.use("/blog", require("./blog/blogRoutes"));


module.exports = router;
