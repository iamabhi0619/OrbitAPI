const express = require("express");
const { register, login, forgetPassword, resetPassword, changePassword, verifyEmail, resendVerification } = require("../../controllers/user/userAuth");
const { verifyToken } = require("../../middlewares/authMiddleware");
const v1Router = require('./auth-routes-v1')


const router = express.Router();



router.post("/signup", register);
router.post("/login", login);
router.post("/forgot-password", forgetPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", verifyToken, changePassword);
router.post("/verify-email", verifyEmail);
router.post("/resend-email", resendVerification);

router.use("/v1", v1Router)


module.exports = router;
