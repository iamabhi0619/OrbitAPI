const express = require('express');
const { getBarcode } = require('../../controllers/utility/barcode');
const router = express.Router();

router.get('/', getBarcode)

module.exports = router;