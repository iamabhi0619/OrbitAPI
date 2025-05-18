const express = require("express");
const logController = require("../controllers/log.controllers");

const router = express.Router();

// Route to get all logs
router.get("/", logController.getAllLogs);

// Route to search and filter logs
router.get("/search", logController.searchAndFilterLogs);

// Route to download logs
router.get("/download", logController.downloadLogs);

// Route to paginate logs
router.get("/paginate", logController.paginateLogs);

// Route to get log summary and analytics
router.get("/summary", logController.logSummary);

// Route to archive old logs
router.post("/archive", logController.archiveOldLogs);

// Route to bulk update or delete logs
router.post("/bulk", logController.bulkUpdateOrDeleteLogs);

// Route to mark a specific log as important
router.post("/important", logController.markLogImportant);

// Route to unmark a specific log as important
router.post("/unimportant", logController.unmarkLogImportant);

module.exports = router;
