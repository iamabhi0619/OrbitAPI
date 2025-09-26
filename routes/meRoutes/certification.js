const express = require('express');
const { getCerts, getCertSummary, getCertById, updateCert, deleteCert, uploadCert } = require('../../controllers/me/meCertification');
const { verifyToken, isAdmin } = require('../../middlewares/authMiddleware');
const cloudinaryUpload = require('../../middlewares/cloudinaryUpload');
const CLOUDINARY_UPLOAD_TYPES = require('../../utils/cloudinaryUploadTypes');
const router = express.Router();

router.post("/", verifyToken, isAdmin, cloudinaryUpload(CLOUDINARY_UPLOAD_TYPES.CERTIFICATE), uploadCert);
router.get("/", getCerts);
router.get("/summary", getCertSummary);
router.get("/:id", getCertById);
router.put("/:id", verifyToken, isAdmin, cloudinaryUpload(CLOUDINARY_UPLOAD_TYPES.CERTIFICATE), updateCert);
router.delete("/:id", verifyToken, isAdmin, deleteCert);


module.exports = router;