const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const user = require("../model/user");
const logger = require("../service/logging");
const User = require("../model/user");
const config = require("../config");
// const { sendPushNotification } = require("../utils/notificationService");

const errorResponse = (res, statusCode, message) => {
  return res.status(statusCode).json({ success: false, message });
};

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASS,
  },
});

// Get All Users with Search and Pagination
exports.getAllUsersAdmin = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    // Create a search query
    const searchQuery = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { role: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // Calculate total users for pagination
    const totalUsers = await user.countDocuments(searchQuery);

    // Fetch users with pagination and search
    const users = await user
      .find(searchQuery)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      users,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.log(error);

    return errorResponse(res, 500, "Server error");
  }
};

// Verify or Block User
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId, isVerified, isBlocked } = req.body;
    await User.findByIdAndUpdate(userId, { isVerified, isBlocked });
    res
      .status(200)
      .json({ success: true, message: "User status updated successfully" });
  } catch (error) {
    return errorResponse(res, 500, "Server error");
  }
};

// Send Push Notification
exports.sendNotification = async (req, res) => {
  try {
    const { userIds, title, message } = req.body;
    await sendPushNotification(userIds, title, message);
    res
      .status(200)
      .json({ success: true, message: "Push notification sent successfully" });
  } catch (error) {
    return errorResponse(res, 500, "Failed to send push notification");
  }
};

// Send Email Newsletter
exports.sendNewsletter = async (req, res) => {
  try {
    const { userIds, subject, htmlContent } = req.body;
    const users = await User.find({ _id: { $in: userIds } });
    const emails = users.map((user) => user.email);

    await transporter.sendMail({
      from: config.EMAIL_USER,
      to: emails,
      subject,
      html: htmlContent,
    });
    res
      .status(200)
      .json({ success: true, message: "Newsletter sent successfully" });
  } catch (error) {
    return errorResponse(res, 500, "Failed to send newsletter");
  }
};

exports.getUserSummary = async (req, res) => {
  try {
    const now = new Date();
    const activeThreshold = new Date(now.setDate(now.getDate() - 20));
    const inactiveThreshold = new Date(now.setMonth(now.getMonth() - 3));

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: activeThreshold },
    });
    const inactiveUsers = await User.countDocuments({
      lastLogin: { $lt: activeThreshold, $gte: inactiveThreshold },
    });
    const dormantUsers = await User.countDocuments({
      lastLogin: { $lt: inactiveThreshold },
    });

    const serviceUsage = await User.aggregate([
      { $unwind: "$servicesAvailed" },
      { $group: { _id: "$servicesAvailed.serviceName", count: { $sum: 1 } } },
    ]);

    const subscriptionStats = await User.aggregate([
      { $group: { _id: "$subscription.plan", count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      summary: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        dormantUsers,
        serviceUsage,
        subscriptionStats,
      },
    });
  } catch (error) {
    console.log(error);
    return errorResponse(res, 500, "Failed to retrieve user summary");
  }
};
