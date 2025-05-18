const express = require("express");
const { register, login, forgetPassword, resetPassword, changePassword, verifyEmail, resendVerification } = require("../../controllers/user/userAuth");
const { verifyToken } = require("../../middlewares/authMiddleware");


const router = express.Router();

router.post("/signup", register);
router.post("/login", login);
router.post("/forget-password", forgetPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", verifyToken, changePassword);
router.post("/verify-email", verifyEmail);
router.post("/resend-email", resendVerification);


module.exports = router;
