const express = require('express');
const { statsLimiter } = require('../config/rate-limiter');
const router = express.Router();


router.use('/projects', require('./meRoutes/projects'));
router.use('/certification', require('./meRoutes/certification'));
router.use('/stats', statsLimiter, require('./meRoutes/stats'));




module.exports = router;