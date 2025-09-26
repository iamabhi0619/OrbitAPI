const express = require('express');
const router = express.Router();

router.use('/barcode', require('./barcode'));

module.exports = router;