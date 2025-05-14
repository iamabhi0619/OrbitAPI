const express = require("express");
const router = express.Router();
const {
  getCerts,
  uploadCert,
  getCertById,
  updateCert,
  deleteCert,
  getCertSummary,
} = require("../controllers/certifications");
const { upload } = require("../middleware/upload");
const { verifyToken, isAdmin } = require("../middleware/auth");

router.post("/", verifyToken, isAdmin, upload.single("file"), uploadCert);
router.get("/summary", verifyToken, isAdmin, getCertSummary);
router.get("/", getCerts);
router.get("/:id", getCertById);
router.put("/:id", verifyToken, isAdmin, upload.single("file"), updateCert);
router.delete("/:id", verifyToken, isAdmin, deleteCert);

module.exports = router;
