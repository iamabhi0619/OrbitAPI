const Contact = require("../../model/Contact");
const ApiError = require("../../utils/ApiError");
const logger = require("../../config/logger");
const { sendEmail } = require("../../config/mailer");

// Admin email for notifications
const ADMIN_EMAIL = "kumarabhishek80000@gmail.com";

// Create new contact message
exports.createContactMessage = async (req, res, next) => {
    try {
        const { name, email, message, category = 'general', priority = 'medium', source = 'website' } = req.body;

        // Validate required fields
        if (!name || !email || !message) {
            return next(new ApiError(400, "All fields are required", "FIELDS_REQUIRED", "Please provide name, email, and message."));
        }

        // Create new contact entry
        const newContact = new Contact({ 
            name: name.trim(), 
            email: email.trim().toLowerCase(), 
            message: message.trim(),
            category,
            priority,
            source
        });
        
        await newContact.save();

        // Send confirmation email to user
        

        res.status(201).json({
            success: true,
            message: "Thank you for reaching out! Your message has been received successfully.",
            data: {
                id: newContact._id,
                status: newContact.status,
                createdAt: newContact.createdAt
            }
        });

        try {
            await sendEmail({
                to: email,
                subject: "Thank You for Reaching Out!",
                template: "contactFormConfirmation.hbs",
                context: { name, message }
            });
        } catch (emailError) {
            logger.error("Failed to send confirmation email", { error: emailError, contactId: newContact._id });
        }

        // Send admin notification email
        try {
            const adminNotificationSubject = `New Contact Form Submission - ${category}`;
            const adminMessage = `
New contact form submission received:

👤 Name: ${name}
📧 Email: ${email}
📂 Category: ${category}
⚡ Priority: ${priority}
💬 Message: ${message}

🆔 Contact ID: ${newContact._id}
� Submitted: ${newContact.createdAt}

You can manage this contact through your admin panel.
            `.trim();

            await sendEmail({
                to: ADMIN_EMAIL,
                subject: adminNotificationSubject,
                template: "contactFormReply.hbs",
                context: {
                    name: "Admin",
                    reply: adminMessage,
                    originalMessage: "New contact form submission notification"
                }
            });
        } catch (emailError) {
            logger.error("Failed to send admin notification email", { error: emailError, contactId: newContact._id });
        }
    } catch (error) {
        if (error.name === "ValidationError") {
            return next(new ApiError(400, "Invalid contact data", "INVALID_CONTACT_DATA", error.message));
        }
        logger.error("Error creating contact message", { error, body: req.body });
        next(new ApiError(500, "Failed to create contact message", "CONTACT_CREATION_FAILED", error.message));
    }
};

// Reply to a contact message
exports.replyToMessage = async (req, res, next) => {
    try {
        const { reply } = req.body;
        const { id } = req.params;

        if (!reply || !reply.trim()) {
            return next(new ApiError(400, "Reply content is required", "REPLY_REQUIRED", "Please provide a reply message."));
        }

        const contact = await Contact.findById(id);
        if (!contact) {
            return next(new ApiError(404, "Contact message not found", "CONTACT_NOT_FOUND", "The specified contact message does not exist."));
        }

        // Update contact with reply
        contact.reply = reply.trim();
        contact.status = "closed";
        contact.repliedAt = new Date();
        await contact.save();

        // Send reply email to user
        try {
            await sendEmail({
                to: contact.email,
                subject: "Reply to Your Contact Form Submission",
                template: "contactFormReply",
                context: { 
                    name: contact.name, 
                    originalMessage: contact.message,
                    reply 
                }
            });

            // Send admin confirmation of reply sent
            await sendAdminAlert(
                "Reply Sent Successfully",
                `Reply sent to contact:\n\n👤 Name: ${contact.name}\n📧 Email: ${contact.email}\n💬 Reply: ${reply}\n\n🆔 Contact ID: ${contact._id}`,
                contact
            );

        } catch (emailError) {
            logger.error("Failed to send reply email", { error: emailError, contactId: id });
            return next(new ApiError(500, "Failed to send reply email", "EMAIL_SEND_FAILED", emailError.message));
        }

        res.status(200).json({ 
            success: true, 
            message: "Reply sent successfully", 
            data: {
                id: contact._id,
                status: contact.status,
                repliedAt: contact.repliedAt
            }
        });
    } catch (error) {
        logger.error("Error replying to contact message", { error, contactId: req.params.id });
        next(new ApiError(500, "Failed to send reply", "REPLY_FAILED", error.message));
    }
};

// Get all contact messages with filtering and pagination
exports.getAllMessages = async (req, res, next) => {
    try {
        const { 
            status, 
            category, 
            priority, 
            page = 1, 
            limit = 20, 
            sortBy = 'createdAt', 
            sortOrder = 'desc' 
        } = req.query;

        // Build filter object
        const filter = {};
        if (status) filter.status = status;
        if (category) filter.category = category;
        if (priority) filter.priority = priority;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        // Get messages with filtering and pagination
        const messages = await Contact.find(filter)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .select('-__v');

        // Get total count for pagination
        const total = await Contact.countDocuments(filter);
        const totalPages = Math.ceil(total / parseInt(limit));

        res.status(200).json({
            success: true,
            data: messages,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalMessages: total,
                hasNext: parseInt(page) < totalPages,
                hasPrev: parseInt(page) > 1
            }
        });
    } catch (error) {
        logger.error("Error fetching contact messages", { error, query: req.query });
        next(new ApiError(500, "Failed to fetch contact messages", "FETCH_MESSAGES_FAILED", error.message));
    }
};

// Get a single contact message by ID
exports.getSingleMessage = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const message = await Contact.findById(id).select('-__v');
        if (!message) {
            return next(new ApiError(404, "Contact message not found", "CONTACT_NOT_FOUND", "The specified contact message does not exist."));
        }

        // Mark as read if not already read
        if (!message.readAt) {
            message.readAt = new Date();
            await message.save();
        }

        res.status(200).json({
            success: true,
            data: message
        });
    } catch (error) {
        logger.error("Error fetching contact message", { error, contactId: req.params.id });
        next(new ApiError(500, "Failed to fetch contact message", "FETCH_SINGLE_MESSAGE_FAILED", error.message));
    }
};

// Update contact message
exports.updateMessage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Remove fields that shouldn't be updated directly
        delete updateData._id;
        delete updateData.createdAt;
        delete updateData.__v;

        const contact = await Contact.findById(id);
        if (!contact) {
            return next(new ApiError(404, "Contact message not found", "CONTACT_NOT_FOUND", "The specified contact message does not exist."));
        }

        // Update contact
        Object.assign(contact, updateData);
        await contact.save();

        res.status(200).json({
            success: true,
            message: "Contact message updated successfully",
            data: contact
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return next(new ApiError(400, "Invalid update data", "INVALID_UPDATE_DATA", error.message));
        }
        logger.error("Error updating contact message", { error, contactId: req.params.id });
        next(new ApiError(500, "Failed to update contact message", "UPDATE_MESSAGE_FAILED", error.message));
    }
};

// Delete contact message
exports.deleteMessage = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const contact = await Contact.findById(id);
        if (!contact) {
            return next(new ApiError(404, "Contact message not found", "CONTACT_NOT_FOUND", "The specified contact message does not exist."));
        }

        await Contact.findByIdAndDelete(id);
        
        res.status(200).json({
            success: true,
            message: "Contact message deleted successfully"
        });
    } catch (error) {
        logger.error("Error deleting contact message", { error, contactId: req.params.id });
        next(new ApiError(500, "Failed to delete contact message", "DELETE_MESSAGE_FAILED", error.message));
    }
};

// Get contact statistics and summary
exports.getContactSummary = async (req, res, next) => {
    try {
        const totalMessages = await Contact.countDocuments();
        
        // Get status counts
        const statusCounts = await Contact.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        // Get category counts
        const categoryCounts = await Contact.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } }
        ]);

        // Get priority counts
        const priorityCounts = await Contact.aggregate([
            { $group: { _id: "$priority", count: { $sum: 1 } } }
        ]);

        // Get recent messages (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentMessages = await Contact.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });

        // Get unread messages count
        const unreadMessages = await Contact.countDocuments({
            readAt: { $exists: false }
        });

        // Get pending replies count
        const pendingReplies = await Contact.countDocuments({
            status: { $in: ['open', 'in-progress'] }
        });

        res.status(200).json({
            success: true,
            data: {
                totalMessages,
                recentMessages,
                unreadMessages,
                pendingReplies,
                statusCounts: statusCounts.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                categoryCounts: categoryCounts.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                priorityCounts: priorityCounts.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {})
            }
        });
    } catch (error) {
        logger.error("Error fetching contact summary", { error });
        next(new ApiError(500, "Failed to fetch contact summary", "SUMMARY_FETCH_FAILED", error.message));
    }
};

// Mark message as read
exports.markAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const contact = await Contact.findById(id);
        if (!contact) {
            return next(new ApiError(404, "Contact message not found", "CONTACT_NOT_FOUND", "The specified contact message does not exist."));
        }

        if (!contact.readAt) {
            contact.readAt = new Date();
            await contact.save();
        }

        res.status(200).json({
            success: true,
            message: "Message marked as read",
            data: { readAt: contact.readAt }
        });
    } catch (error) {
        logger.error("Error marking message as read", { error, contactId: req.params.id });
        next(new ApiError(500, "Failed to mark message as read", "MARK_READ_FAILED", error.message));
    }
};

// Update message status
exports.updateMessageStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['open', 'in-progress', 'closed'].includes(status)) {
            return next(new ApiError(400, "Invalid status", "INVALID_STATUS", "Status must be one of: open, in-progress, closed"));
        }

        const contact = await Contact.findById(id);
        if (!contact) {
            return next(new ApiError(404, "Contact message not found", "CONTACT_NOT_FOUND", "The specified contact message does not exist."));
        }

        contact.status = status;
        await contact.save();

        res.status(200).json({
            success: true,
            message: "Message status updated successfully",
            data: { status: contact.status, updatedAt: contact.updatedAt }
        });
    } catch (error) {
        logger.error("Error updating message status", { error, contactId: req.params.id });
        next(new ApiError(500, "Failed to update message status", "STATUS_UPDATE_FAILED", error.message));
    }
};

// Helper function to send admin alerts
const sendAdminAlert = async (subject, message, contactData = null) => {
    try {
        await sendEmail({
            to: ADMIN_EMAIL,
            subject: `[OrbitAPI Alert] ${subject}`,
            template: "contactFormReply.hbs",
            context: {
                name: "Admin",
                reply: message,
                originalMessage: contactData ? `Contact ID: ${contactData._id}` : "System notification"
            }
        });
        logger.info("Admin alert sent successfully", { subject, to: ADMIN_EMAIL });
    } catch (error) {
        logger.error("Failed to send admin alert", { error, subject, to: ADMIN_EMAIL });
    }
};