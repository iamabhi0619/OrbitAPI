const mongoose = require("mongoose");
const TelegramBot = require("node-telegram-bot-api");
const logger = require("../service/logging");
const config = require("../config");
const { sendEmail, emailTemplates } = require("../utility/emailService");
const ApiError = require("../utility/ApiError");

const bot = new TelegramBot(config.TELEGRAM_TOKEN, { polling: true });

const ContactSchema = new mongoose.Schema({
  name: String,
  email: String,
  feedback: { type: String, default: "" },
  message: String,
  reply: { type: String, default: "" },
  status: { type: String, default: "open" },
  createdAt: { type: Date, default: Date.now },
});

const Contact = mongoose.model("Contact", ContactSchema);

exports.createContactMessage = async (req, res, next) => {
  try {
    const { name, email, message } = req.body;
    // Validate required fields
    if (!name || !email || !message) {
      return next(new ApiError(400, "All fields are required.", "FIELDS_REQUIRED", "Please fill all fields."));
    }

    // Create a new contact message
    const newContact = new Contact({ name, email, message });
    await newContact.save();

    // Send confirmation email
    try {
      await sendEmail({
        to: email,
        subject: "Contact Form Submission Confirmation",
        template: emailTemplates.CONTACT_FORM_CONFIRMATION.template,
        context: {
          name,
          phone: newContact.phone || "Not provided",
          message,
        },
      });
    } catch (emailError) {
      logger.error("Error sending confirmation email:", emailError);
      return next(new ApiError(500, "Failed to send confirmation email.", "EMAIL_SEND_ERROR", "We are unable to send confirmation email."));
    }
    // Notify via Telegram
    try {
      await bot.sendMessage(
        config.TELEGRAM_CHAT_ID,
        `📧 New Contact Form Submission\n\nName: ${name}\nEmail: ${email}\nMessage: ${message}`
      );
    } catch (telegramError) {
      logger.error("Error sending Telegram notification:", telegramError);
      return next(new ApiError(500, "Failed to send Telegram notification.", "TELEGRAM_SEND_ERROR"));
    }
    // Respond with success
    res.status(201).json({
      success: true,
      message: "Thank you for reaching out! Your message has been received successfully.",
    });
  } catch (error) {
    logger.error("Error creating contact message:", error);
    next(new ApiError(500, "Error creating contact message.", "CONTACT_CREATION_ERROR", "Please try again."));
  }
};

exports.replyToMessage = async (req, res, next) => {
  try {
    const { reply } = req.body;
    if (!reply) {
      return next(new ApiError(400, "Reply message is required.", "REPLY_REQUIRED", "Please provide a reply message."));
    }
    const updatedMessage = await Contact.findByIdAndUpdate(
      req.params.id,
      { reply, status: "closed" },
      { new: true }
    );

    if (!updatedMessage) {
      return next(new ApiError(404, "Message not found", "MESSAGE_NOT_FOUND", "No such Message...!!"))

    }
    await sendEmail({
      to: updatedMessage.email,
      subject: "Reply to your Contact Form Submission",
      template: emailTemplates.CONTACT_FORM_REPLY.template,
      context: {
        name: updatedMessage.name,
        reply,
        message: updatedMessage.message,
      },
    });
    res.json({ message: "Reply sent successfully", updatedMessage });
  } catch (error) {
    logger.error(`Error replying to message with id: ${req.params.id}`, error);
    res.status(500).json({ error: "Oops! Something went wrong. Please try again later." });
  }
};

exports.getAllMessages = async (req, res, next) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    logger.error("Error fetching all messages", error);
    next(new ApiError(500, "Error fetching messages", "FETCH_MESSAGES_ERROR", "Please try again."));
  }
};

exports.getSingleMessage = async (req, res, next) => {
  try {
    const message = await Contact.findById(req.params.id);
    if (!message) {
      return next(new ApiError(404, "Message not found", "MESSAGE_NOT_FOUND", "No such Message...!!"));
    }
    res.json(message);
  } catch (error) {
    logger.error(`Error fetching message with id: ${req.params.id}`, error);
    if (error instanceof mongoose.CastError) {
      return next(new ApiError(400, "Invalid message ID", "INVALID_MESSAGE_ID", "Please provide a valid message ID."));
    }
    next(new ApiError(500, "Error fetching message", "FETCH_MESSAGE_ERROR", "Please try again."));
  }
};

exports.updateMessage = async (req, res, next) => {
  try {
    await Contact.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: "Message updated successfully" });
  } catch (error) {
    logger.error(`Error updating message with id: ${req.params.id}`, error);
    if (error instanceof mongoose.CastError) {
      return next(new ApiError(400, "Invalid message ID", "INVALID_MESSAGE_ID", "Please provide a valid message ID."));
    }
    next(new ApiError(500, "Error updating message", "UPDATE_MESSAGE_ERROR", "Please try again."));
  }
};

exports.deleteMessage = async (req, res, next) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    logger.error(`Error deleting message with id: ${req.params.id}`, error);
    if (error instanceof mongoose.CastError) {
      return next(new ApiError(400, "Invalid message ID", "INVALID_MESSAGE_ID", "Please provide a valid message ID."));
    }
    next(new ApiError(500, "Error deleting message", "DELETE_MESSAGE_ERROR", "Please try again."));
  }
};
