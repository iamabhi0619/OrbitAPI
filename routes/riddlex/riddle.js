const express = require('express');
const router = express.Router();
const riddleController = require('../../controllers/riddlex/riddle');

// Public routes
router.get('/', riddleController.getAllRiddles);
router.get('/search', riddleController.searchRiddles);
router.get('/stats/summary', riddleController.getSummary);
router.get('/config', riddleController.getConfig);
router.get('/:id', riddleController.getSingleRiddle);

// Admin routes (you might want to add authentication middleware)
router.post('/', riddleController.addRiddle);
router.put('/:id', riddleController.updateRiddle);
router.delete('/:id', riddleController.deleteRiddle);

module.exports = router;
