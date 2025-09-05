const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../../middlewares/authMiddleware');
const {
    createContactMessage,
    getAllMessages,
    getSingleMessage,
    updateMessage,
    deleteMessage,
    replyToMessage,
    getContactSummary,
    markAsRead,
    updateMessageStatus
} = require('../../controllers/contact/contactController');

// Public route - No authentication required for contact form submission
router.post('/', createContactMessage);

// Admin routes - Require authentication and admin role
router.get('/', verifyToken, isAdmin, getAllMessages);
router.get('/summary', verifyToken, isAdmin, getContactSummary);
router.get('/:id', verifyToken, isAdmin, getSingleMessage);
router.put('/:id', verifyToken, isAdmin, updateMessage);
router.delete('/:id', verifyToken, isAdmin, deleteMessage);
router.post('/:id/reply', verifyToken, isAdmin, replyToMessage);
router.patch('/:id/read', verifyToken, isAdmin, markAsRead);
router.patch('/:id/status', verifyToken, isAdmin, updateMessageStatus);

module.exports = router;