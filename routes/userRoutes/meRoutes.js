const express = require('express');
const { getOwnData, updateUser, deleteUser, getLoginHistory, getUserSettings, userAvatarUpdate } = require('../../controllers/user/userMe');
const { verifyToken } = require('../../middlewares/authMiddleware');
const cloudinaryUpload = require('../../middlewares/cloudinaryUpload');
const CLOUDINARY_UPLOAD_TYPES = require('../../utils/cloudinaryUploadTypes');

const router = express.Router();

router.get("/", verifyToken, getOwnData);
router.put("/", verifyToken, updateUser);
// router.delete("/me.:id", verifyToken, deleteUser);
router.get("/login-history", verifyToken, getLoginHistory);
router.get("/settings", verifyToken, getUserSettings);
router.post("/avatar", verifyToken, cloudinaryUpload(CLOUDINARY_UPLOAD_TYPES.AVATAR), userAvatarUpdate);

module.exports = router;