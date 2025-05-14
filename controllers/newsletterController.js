const Newsletter = require("../model/Newsletter");
const User = require("../model/user");
const logger = require("../service/logging");
const sendEmail = require("../utility/emailService");

exports.createNewsletter = async (req, res) => {
  try {
    const { title, content, recipients } = req.body;
    const newsletter = await Newsletter.create({ title, content, recipients });
    res.status(201).json({ success: true, newsletter });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.sendNewsletter = async (req, res) => {
  try {
    const { id } = req.params;
    const newsletter = await Newsletter.findById(id);
    if (!newsletter) {
      return res.status(404).json({ success: false, error: "Newsletter not found" });
    }
    if (newsletter.status === "sent") {
      return res.status(400).json({ success: false, error: "Newsletter already sent" });
    }
    if (!Array.isArray(newsletter.recipients) || newsletter.recipients.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "No recipients to send the newsletter" });
    }
    await Promise.all(
      newsletter.recipients.map((email) => sendEmail(email, newsletter.title, newsletter.content))
    );
    newsletter.status = "sent";
    newsletter.sentAt = new Date();
    await newsletter.save();
    res.status(200).json({ success: true, message: "Newsletter sent successfully" });
  } catch (err) {
    logger.error(`Error sending newsletter with ID ${req.params.id}:`, err.message);
    res.status(500).json({ success: false, error: "Failed to send the newsletter" });
  }
};

exports.getAllNewsletters = async (req, res) => {
  try {
    const newsletter = await Newsletter.find();
    res.status(200).json({ success: true, newsletter });
  } catch (error) {
    logger.error("Error getting the Newsletters:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSingleNewsletters = async (req, res) => {
  try {
    const { id } = req.params;
    const newsletter = await Newsletter.findById(id);
    res.status(200).json({ success: true, newsletter });
  } catch (error) {
    logger.error(`Error getting the  Newsletters ID${id}:`, error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSubscribers = async (req, res) => {
  try {
    const subscribers = await User.find({ isNewsletters: true }, "name email avatar gender");
    res.status(200).json({ success: true, subscribers });
  } catch (error) {
    logger.error("Error getting the subscribers:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateNewsletter = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const newsletter = await Newsletter.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!newsletter) {
      return res.status(404).json({ success: false, message: "Newsletter not found" });
    }
    res.status(200).json({ success: true, message: "Newsletter updated successfully", newsletter });
  } catch (error) {
    logger.error(`Error updating newsletter with ID ${id}:`, error.message);
    res.status(500).json({ success: false, message: "Failed to update newsletter" });
  }
};

exports.deleteNewsletter = async (req, res) => {
  try {
    const { id } = req.params;
    const newsletter = await Newsletter.findByIdAndDelete(id);
    if (!newsletter) {
      return res.status(404).json({ success: false, message: "Newsletter not found" });
    }
    res.status(200).json({ success: true, message: "Newsletter deleted successfully" });
  } catch (error) {
    logger.error(`Error deleting newsletter with ID ${id}:`, error.message);
    res.status(500).json({ success: false, message: "Failed to delete newsletter" });
  }
};

exports.getNewslettersByType = async (req, res) => {
  try {
    const { type } = req.params;
    const newsletters = await Newsletter.find({status: type});
    if (!newsletters.length) {
      return res
        .status(404)
        .json({ success: false, message: `No active ${type} Newsletter found.` });
    }
    res.status(200).json({ success: true, count: newsletters.length, newsletters });
  } catch (error) {
    logger.error(`Error fetching newsletters by type ${req.params.type}:`, error.message);
    res.status(500).json({ success: false, message: "Failed to fetch newsletters" });
  }
};

exports.getSummery = async (req, res) => {
  try {
    const [
      subscribersCount,
      totalUser,
      totalSent,
      totalDraft,
      history
    ] = await Promise.all([
      User.countDocuments({ isNewsletters: true }),
      User.countDocuments({}),
      Newsletter.countDocuments({ status: 'sent' }),
      Newsletter.countDocuments({ status: 'draft' }),
      Newsletter.find().sort({ _id: -1 }).limit(10)
    ]);

    const reach = (subscribersCount / totalUser) * 100 || 0;

    const data = {
      subscribersCount,
      totalUser,
      totalSent,
      totalDraft,
      reach,
      history
    };

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error(`Error fetching newsletters summary:`, error.message);
    res.status(500).json({ success: false, message: "Failed to fetch newsletters" });
  }
};
