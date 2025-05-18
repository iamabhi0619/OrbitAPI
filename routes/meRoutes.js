const express = require('express');
const router = express.Router();


router.use('/projects', require('./meRoutes/projects'));




module.exports = router;