const User = require("../model/user");
const logger = require("../service/logging");


const errorResponse = (res, statusCode, message) => {
  return res.status(statusCode).json({ success: false, message });
};

// Get User Profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -loginHistory -activityLog -servicesAvailed"
    );
    if (!user) {
      logger.warn(`User with ID: ${req.user._id} not found`);
      return errorResponse(res, 404, "User not found");
    }
    logger.info(`Successfully fetched profile for userId: ${user.name}`);
    res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      user
    }
    )
  } catch (error) {
    logger.error(`Error fetching profile for userId: ${req.user._id}`, error);
    return errorResponse(res, 500, "Server error");
  }
};

// Update User Profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar, gender, bio, isNewsletters } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { name, avatar, gender, bio, isNewsletters } },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      logger.warn(`User with ID: ${req.user._id} not found during profile update`);
      return errorResponse(res, 404, "User not found");
    }
    updatedUser.activityLog.push({
      action: `Profile updated by with ${name} ${avatar} ${gender}`,
      timestamp: new Date(),
    });
    await updatedUser.save();
    logger.info(`Profile updated successfully for user: ${updatedUser.userId}`);
    const sanitizedUser = {
      _id: updatedUser._id,
      role: updatedUser.role,
      name: updatedUser.name,
      userId: updatedUser.userId,
      gender: updatedUser.gender,
      avatar: updatedUser.avatar,
      email: updatedUser.email,
      lastLogin: updatedUser.lastLogin,
    };
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: sanitizedUser,
    });
  } catch (error) {
    logger.error(`Error updating profile for userId: ${req.user._id}`, error);
    return errorResponse(res, 500, "Server error");
  }
};

// Delete User Account
exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.user._id);
    if (!deletedUser) {
      logger.warn(`User with ID: ${req.user._id} not found during account deletion`);
      return errorResponse(res, 404, "User not found");
    }
    logger.info(`User with userId: ${deletedUser.userId} deleted successfully`);
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    logger.error("Error during account deletion", error);
    return errorResponse(res, 500, "Server error");
  }
};

// Get All Users (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    logger.info("Fetched all users for admin");
    res.status(200).json({ success: true, users });
  } catch (error) {
    logger.error("Error fetching all users", error);
    return errorResponse(res, 500, "Server error");
  }
};

// Get User Login History
exports.getLoginHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("loginHistory");
    if (!user) {
      logger.warn(`User with ID: ${req.user._id} not found during login history fetch`);
      return errorResponse(res, 404, "User not found");
    }
    user.loginHistory.reverse();
    user.activityLog.push({
      action: "Login history Accessed",
      timestamp: new Date(),
    });
    logger.info(`Fetched login history for userId: ${req.user.userId}`);
    res.status(200).json({ success: true, loginHistory: user.loginHistory });
  } catch (error) {
    logger.error(`Error fetching login history for userId: ${req.user.userId}`, error);
    return errorResponse(res, 500, "Server error");
  }
};

// Get User Activity Log
exports.getActivityLog = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("activityLog");
    if (!user) {
      logger.warn(`User with ID: ${req.user._id} not found during activity log fetch`);
      return errorResponse(res, 404, "User not found");
    }
    logger.info(`Fetched activity log for userId: ${user.userId}`);
    res.status(200).json({ success: true, activityLog: user.activityLog });
  } catch (error) {
    logger.error(`Error fetching activity log for ID: ${req.user._id}`, error);
    return errorResponse(res, 500, "Server error");
  }
};

// Update User Settings
exports.updateSettings = async (req, res) => {
  try {
    const { theme, language, notifications } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          "settings.theme": theme,
          "settings.language": language,
          "settings.notifications": notifications,
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      logger.warn(`User with ID: ${req.user._id} not found during settings update`);
      return errorResponse(res, 404, "User not found");
    }

    updatedUser.activityLog.push({
      action: "User updated settings",
      timestamp: new Date(),
    });

    await updatedUser.save();
    logger.info(`Settings updated successfully for ID: ${req.user._id}`);
    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      settings: updatedUser.settings,
    });
  } catch (error) {
    logger.error(`Error updating settings for ID: ${req.user._id}`, error);
    return errorResponse(res, 500, "Server error");
  }
};

exports.searchUser = async (req, res) => {
  try {
    const { query } = req;
    const searchValue = query.search; // Extract search value

    if (!searchValue) {
      return res.status(400).json({ message: "Search parameter is required" });
    }

    const users = await User.find({
      $or: [
        { userId: { $regex: searchValue, $options: "i" } },
        { email: { $regex: searchValue, $options: "i" } },
        { name: { $regex: searchValue, $options: "i" } },
      ],
    }).select("userId _id name avatar gender");

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
