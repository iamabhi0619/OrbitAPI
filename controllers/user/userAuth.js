const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../../model/user");
const ApiError = require("../../utils/ApiError");
const config = require("../../config");
const logger = require("../../config/logger");
const { updateServiceAvailed, userDataSanitization } = require("../../utils/userRelatedFunc");
const { sendEmail, emailTemplates } = require("../../config/mailer");
const resetTokens = new Map();

// Register User with Email Verification
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, gender, serviceId, serviceName, avatar } = req.body;
    // Validate required fields
    if (!name || !email || !password || !gender) {
      return next(new ApiError(400, "All fields are required.", "FIELDS_REQUIRED", "Please provide all required fields."));
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Set default avatar if not provided
    const userAvatar = avatar || `https://avatar.iran.liara.run/public/${gender === "male" ? "boy" : "girl"}?username=${name}`;
    // Create a new user instance
    const newUser = new User({
      userId: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      gender,
      avatar: userAvatar,
      isVerified: false,
      servicesAvailed: [
        {
          serviceId,
          serviceName,
          firstUsedOn: new Date(),
          lastUsedOn: new Date(),
          usageCount: 1,
          status: "active",
        },
      ],
      activityLog: [
        {
          action: "User registered",
          timestamp: new Date(),
        },
      ],
    });

    // Save the user to the database
    await newUser.save();
    const token = jwt.sign({ userId: newUser._id }, config.SECRET, { expiresIn: "10m" });
    const verificationUrl = `${config.CLIENT_URL}/auth/verify-email?token=${token}`;
    await sendEmail({
      to: newUser.email,
      subject: "Email Verification",
      template: emailTemplates.EMAIL_VERIFICATION.template,
      context: {
        name: newUser.name,
        url: verificationUrl,
      }
    })
    res.status(201).json({
      success: true,
      message: "User registered successfully. Please verify your email.",
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      return next(new ApiError(409, "Email already exists.", "EMAIL_EXISTS", "The provided email is already registered."));
    }
    logger.error("Error during user registration", error);
    next(error);
  }
};

// Login User
exports.login = async (req, res, next) => {
  try {
    const { email, password, serviceId, serviceName } = req.body;
    // Validate required fields
    if (!email || !password) {
      return next(new ApiError(400, "Email and password are required.", "FIELDS_REQUIRED", "Please provide both email and password."));
    }
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ApiError(404, "User not found", "USER_NOT_FOUND", "The provided email does not exist in our records."));
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new ApiError(401, "Invalid credentials", "INVALID_CREDENTIALS", "The provided password is incorrect."));
    }
    if (!user.isVerified) {
      return next(new ApiError(403, "Account not verified", "ACCOUNT_NOT_VERIFIED", "Your account is not yet verified. Please check your inbox for the verification link."));
    }
    const token = jwt.sign({ role: user.role, _id: user._id }, config.SECRET, { expiresIn: "5d" });
    await updateServiceAvailed(user, serviceId, serviceName);
    user.lastLogin = new Date();
    user.loginHistory.push({
      ip: req.ip,
      device: req.headers["user-agent"],
      timestamp: new Date(),
    });

    await user.save();

    const sanitizedUser = userDataSanitization(user);
    res.status(200).json({ success: true, message: "Login successful", token, user: sanitizedUser });
  } catch (error) {
    logger.error("Error during login process", { error });
    next(error);
  }
};

// Forget Password
exports.forgetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return next(new ApiError(400, "Email is required.", "EMAIL_REQUIRED", "Please provide a valid email address."));
    }
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ApiError(404, "User not found.", "USER_NOT_FOUND", "The provided email does not exist in our records."));
    }
    const resetToken = jwt.sign({ email }, config.SECRET, { expiresIn: "10m" });
    resetTokens.set(email, { token: resetToken, expiresAt: Date.now() + 10 * 60 * 1000 });
    const resetLink = `${config.CLIENT_URL}/auth/change-password?token=${resetToken}&email=${email}`;
    await sendEmail({
      to: user.email,
      subject: "Reset Your Password",
      template: emailTemplates.PASSWORD_RESET.template,
      context: {
        name: user.name,
        url: resetLink,
      }
    })

    res.status(200).json({ success: true, message: "Password reset email sent successfully." });
  } catch (error) {
    console.log(error);

    logger.error("Error in forgetPassword handler", { error });
    next(error);
  }
};

// Reset Password
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return next(new ApiError(400, "Email, token, and new password are required.", "INPUT_REQUIRED", "Please provide email, token, and new password."));
    }

    const storedToken = resetTokens.get(email);
    if (!storedToken || storedToken.token !== token || Date.now() > storedToken.expiresAt) {
      return next(new ApiError(401, "Invalid or expired link", "INVALID_TOKEN", "The link is expired or invalid. Please request a new one."));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.SECRET);
    } catch (err) {
      logger.error("Error verifying token", { error: err });
      return next(new ApiError(401, "Invalid token.", "TOKEN_VERIFICATION_FAILED", "The token could not be verified."));
    }

    if (decoded.email !== email) {
      return next(new ApiError(401, "Invalid token.", "INVALID_TOKEN", "The token does not match the provided email."));
    }

    const user = await User.findOne({ email });
    if (!user) {
      return next(new ApiError(404, "User not found.", "USER_NOT_FOUND", "The provided email does not exist in our records."));
    }

    try {
      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();
    } catch (err) {
      logger.error("Error saving new password", { error: err });
      return next(new ApiError(500, "Failed to save new password.", "PASSWORD_SAVE_ERROR", "Could not save the new password."));
    }

    resetTokens.delete(email);
    res.status(200).json({ success: true, message: "Password reset successful." });
  } catch (error) {
    logger.error("Error in resetPassword handler", { error });
    next(error);
  }
};

// Change Password
exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!oldPassword || !newPassword) {
      return next(new ApiError(400, "Old password and new password are required.", "PASSWORD_REQUIRED", "Please provide both old and new passwords."));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(new ApiError(404, "User not found.", "USER_NOT_FOUND", "The user does not exist."));
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return next(new ApiError(401, "Old password is incorrect.", "INCORRECT_PASSWORD", "The provided old password is incorrect."));
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ success: true, message: "Password changed successfully." });
  } catch (error) {
    logger.error("Error in changePassword handler", { error });
    next(error);
  }
};

// Resend Verification Email
exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return next(new ApiError(400, "Email is required.", "EMAIL_REQUIRED", "Please provide a valid email address."));
    }
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ApiError(404, "User not found.", "USER_NOT_FOUND", "The provided email does not exist in our records."));
    }
    if (user.isVerified) {
      return next(new ApiError(400, "Email is already verified.", "EMAIL_VERIFIED", "The provided email is already verified."));
    }
    const token = jwt.sign({ userId: user._id }, config.SECRET, { expiresIn: "10m" });
    const verificationUrl = `${config.CLIENT_URL}/auth/verifyEmail?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: "Email Verification",
      template: sendEmail.emailTemplates.EMAIL_VERIFICATION.template,
      context: {
        name: user.name,
        url: verificationUrl,
      }
    })
    res.status(200).json({ success: true, message: "Verification mail sent" });
  } catch (error) {
    logger.error("Error resending verification email", { error });
    next(error);
  }
};

// Verify Email
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return next(new ApiError(401, "Invalid or expired link", "INVALID_TOKEN", "The link is expired or invalid. Please request a new one."));
    }

    const decoded = jwt.verify(token, config.SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return next(new ApiError(404, "User not found", "USER_NOT_FOUND", "The user does not exist."));
    }

    if (user.isVerified) {
      return next(new ApiError(400, "Email is already verified", "EMAIL_VERIFIED", "The provided email is already verified."));
    }

    user.isVerified = true;
    user.activityLog.push({
      action: "Email verified",
      timestamp: new Date(),
    });
    await user.save();
    await sendEmail({
      to: user.email,
      subject: "Welcome to Abhishek's Services",
      template: emailTemplates.WELCOME.template,
      context: {
        name: user.name,
      }
    })
    res.status(200).json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    logger.error("Error verifying email", { error });
    next(error);
  }
};