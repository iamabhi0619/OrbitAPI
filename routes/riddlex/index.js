const express = require('express');
const router = express.Router();

// Import riddle routes
const riddleRoutes = require('./riddle');

// Mount riddle routes
router.use('/riddle', riddleRoutes);

module.exports = router;
