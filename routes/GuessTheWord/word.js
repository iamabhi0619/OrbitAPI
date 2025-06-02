const express = require("express");
const router = express.Router();

const wordController = require('../../controllers/GuessTheWord/word');
const { verifyToken, isAdmin } = require("../../middlewares/authMiddleware");

router.get('/', verifyToken, isAdmin, wordController.getWord);
router.get('/search', verifyToken, isAdmin, wordController.searchWords);
router.get('/filter', verifyToken, isAdmin, wordController.filterWords);
router.get('/summary', verifyToken, isAdmin, wordController.summery);
router.get('/:id', verifyToken, isAdmin, wordController.getSingleWord);
router.post('/', verifyToken, isAdmin, wordController.addWord);
router.put('/:id', verifyToken, isAdmin, wordController.updateWord);
router.delete('/:id', verifyToken, isAdmin, wordController.deleteWord);

module.exports = router;
