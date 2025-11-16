const bcrypt = require('bcrypt');
const crypto = require('crypto');
const redis = require("../../config/redis");
const User = require("../../model/user");
const ApiError = require("../../utils/ApiError");
const config = require('../../config/index');
const { sendEmail, emailTemplates } = require("../../config/mailer");
const logger = require("../../config/logger");
const { v4: uuidv4 } = require('uuid');

const generateToken = (payload, expiresIn) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(payload, config.SECRET, { expiresIn });
}

exports.register = async (req, res, next) => {
    try {
        const { name, email, password, gender, serviceId, serviceName, avatar } = req.body;
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            throw new ApiError(400, "Name is required", "NAME_REQUIRED", "Please provide a valid name");
        }
        if (name.trim().length > 100) {
            throw new ApiError(400, "Name is too long", "NAME_TOO_LONG", "Name cannot exceed 100 characters");
        }
        if (!email || typeof email !== 'string' || email.trim().length === 0) {
            throw new ApiError(400, "Email is required", "EMAIL_REQUIRED", "Please provide a valid email");
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new ApiError(400, "Invalid email format", "INVALID_EMAIL", "Please provide a valid email address");
        }
        if (email.length > 255) {
            throw new ApiError(400, "Email is too long", "EMAIL_TOO_LONG", "Email cannot exceed 255 characters");
        }
        if (!password || typeof password !== 'string') {
            throw new ApiError(400, "Password is required", "PASSWORD_REQUIRED", "Please provide a password");
        }
        if (password.length > 128) {
            throw new ApiError(400, "Password is too long", "PASSWORD_TOO_LONG", "Password cannot exceed 128 characters");
        }
        const passwordRgx = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
        if (!passwordRgx.test(password)) {
            throw new ApiError(
                400,
                "Invalid password format",
                "INVALID_PASSWORD",
                "Password must be at least 8 characters long and contain at least one letter and one number"
            );
        }
        if (gender) {
            const validGenders = ['male', 'female', 'other'];
            if (!validGenders.includes(gender.toLowerCase())) {
                throw new ApiError(400, "Invalid gender", "INVALID_GENDER", "Gender must be one of: male, female, other");
            }
        }

        if (avatar && typeof avatar === 'string') {
            try {
                new URL(avatar);
                if (avatar.length > 500) {
                    throw new ApiError(400, "Avatar URL is too long", "AVATAR_URL_TOO_LONG", "Avatar URL cannot exceed 500 characters");
                }
            } catch (urlError) {
                throw new ApiError(400, "Invalid avatar URL", "INVALID_AVATAR_URL", "Please provide a valid avatar URL");
            }
        }
        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            throw new ApiError(409, "Email already exists", "EMAIL_EXISTS", "The provided email is already registered");
        }
        const userAvatar = avatar || `https://api.dicebear.com/9.x/shapes/png?seed=${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        const hashedPassword = await bcrypt.hash(password, 12);
        const userId = `USR${Date.now()}${crypto.randomBytes(2).toString('hex')}`;
        const newUser = new User({
            userId,
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            gender: gender?.toLowerCase(),
            avatar: userAvatar,
            isVerified: false,
            servicesAvailed: serviceId && serviceName ? [
                {
                    serviceId: String(serviceId).trim(),
                    serviceName: String(serviceName).trim(),
                    firstUsedOn: new Date(),
                    lastUsedOn: new Date(),
                    usageCount: 1,
                    status: "active",
                },
            ] : [],
            activityLog: [
                {
                    action: "User registered",
                    timestamp: new Date(),
                },
            ],
        });
        await newUser.save();
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        try {
            await redis.setex(
                `email_verification:${newUser.userId}`,
                600,
                JSON.stringify({
                    token: emailVerificationToken,
                    email: newUser.email,
                    redirect: req.hostname || config.DOMAIN
                })
            );
        } catch (redisError) {
            logger.error("Redis error during email verification token storage", {
                userId: newUser._id,
                error: redisError.message,
                stack: redisError.stack
            });
        }
        const verificationUrl = `${config.CLIENT_URL}/auth/verify-email?token=${emailVerificationToken}&user=${newUser.userId}`;
        sendEmail({
            to: newUser.email,
            subject: "Email Verification",
            template: emailTemplates.EMAIL_VERIFICATION.template,
            context: {
                name: newUser.name,
                url: verificationUrl
            }
        }).catch(emailError => {
            logger.error("Error sending verification email", {
                userId: newUser._id,
                email: newUser.email,
                error: emailError.message,
                stack: emailError.stack
            });
        });
        res.status(201).json({
            success: true,
            message: "User registered successfully. Please check your email to verify your account.",
            data: {
                userId: newUser._id,
                email: newUser.email
            }
        });

    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        if (error.code === 11000) {
            if (error.keyPattern?.email) {
                return next(new ApiError(409, "Email already exists", "EMAIL_EXISTS", "The provided email is already registered"));
            }
            if (error.keyPattern?.userId) {
                return next(new ApiError(500, "User ID conflict", "USERID_CONFLICT", "Please try again"));
            }
            return next(new ApiError(409, "Duplicate entry", "DUPLICATE_ERROR", "A user with this information already exists"));
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return next(new ApiError(400, "Validation failed", "VALIDATION_ERROR", messages.join(', ')));
        }
        logger.error("Error during user registration", error);
        next(error);
    }
};

exports.resendVerification = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email || typeof email !== 'string' || email.trim().length === 0) {
            throw new ApiError(400, "Email is required", "EMAIL_REQUIRED", "Please provide a valid email address");
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new ApiError(400, "Invalid email format", "INVALID_EMAIL", "Please provide a valid email address");
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            throw new ApiError(404, "User not found", "USER_NOT_FOUND", "The provided email does not exist in our records");
        }

        if (user.isVerified) {
            throw new ApiError(400, "Email is already verified", "EMAIL_VERIFIED", "This email is already verified");
        }

        // Check for existing token to prevent spamming
        const existingTokenKey = `email_verification:${user.userId}`;
        const ttl = await redis.ttl(existingTokenKey);

        // ttl > 300 means more than 5 minutes remaining (out of 10 minutes total)
        // ttl = -2 means key doesn't exist, ttl = -1 means key exists but has no expiry
        if (ttl > 300) {
            throw new ApiError(
                429,
                "Too many requests",
                "RATE_LIMIT_EXCEEDED",
                `Please wait ${Math.ceil(ttl / 60)} minutes before requesting a new verification email`
            );
        }

        // Generate new verification token
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        try {
            await redis.setex(
                `email_verification:${user.userId}`,
                600, // 10 minutes
                JSON.stringify({
                    token: emailVerificationToken,
                    email: user.email,
                    redirect: req.hostname || config.DOMAIN
                })
            );
        } catch (redisError) {
            logger.error("Redis error during email verification token storage", redisError);
            throw new ApiError(500, "Failed to generate verification token", "TOKEN_GENERATION_FAILED", "Please try again later");
        }

        const verificationUrl = `${config.CLIENT_URL}/auth/verify-email?token=${emailVerificationToken}&user=${user.userId}`;
        sendEmail({
            to: user.email,
            subject: "Email Verification",
            template: emailTemplates.EMAIL_VERIFICATION.template,
            context: {
                name: user.name,
                url: verificationUrl,
            }
        }).catch(emailError => {
            logger.error("Error sending verification email", {
                userId: user._id,
                email: user.email,
                error: emailError.message,
                stack: emailError.stack
            });
        });

        res.status(200).json({
            success: true,
            message: "Verification email sent successfully. Please check your inbox."
        });

    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        logger.error("Error resending verification email", error);
        next(error);
    }
}

exports.verifyEmail = async (req, res, next) => {
    try {
        const { token, user, isLogin } = req.query;
        if (!token || typeof token !== 'string') {
            throw new ApiError(400, "Verification token is required", "TOKEN_REQUIRED", "Please provide a valid verification token");
        }

        if (!user || typeof user !== 'string') {
            throw new ApiError(400, "User ID is required", "USER_ID_REQUIRED", "Please provide a valid user ID");
        }

        const userDoc = await User.findOne({ userId: user });
        if (!userDoc) {
            throw new ApiError(404, "User not found", "USER_NOT_FOUND", "The user does not exist");
        }

        if (userDoc.isVerified) {
            return res.status(200).json({
                success: true,
                message: "Email is already verified",
                data: {
                    isVerified: true
                }
            });
        }

        const redisKey = `email_verification:${user}`;
        let storedData;
        try {
            const redisValue = await redis.get(redisKey);
            if (!redisValue) {
                throw new ApiError(400, "Invalid or expired token", "TOKEN_EXPIRED", "The verification link has expired. Please request a new one");
            }
            storedData = JSON.parse(redisValue);
        } catch (redisError) {
            if (redisError instanceof ApiError) {
                throw redisError;
            }
            logger.error("Redis error during email verification", {
                userId: user,
                error: redisError.message,
                stack: redisError.stack
            });
            throw new ApiError(500, "Verification failed", "VERIFICATION_ERROR", "Unable to verify email. Please try again");
        }

        if (storedData.token !== token) {
            throw new ApiError(400, "Invalid token", "INVALID_TOKEN", "The verification token is invalid");
        }

        // Update user verification status
        userDoc.isVerified = true;
        userDoc.activityLog.push({
            action: "Email verified",
            timestamp: new Date()
        });
        await userDoc.save();

        // Delete token from Redis
        try {
            await redis.del(redisKey);
        } catch (redisError) {
            logger.error("Error deleting verification token from Redis", {
                userId: user,
                error: redisError.message
            });
        }

        // Send welcome email
        sendEmail({
            to: userDoc.email,
            subject: "Welcome to Abhishek's Services",
            template: emailTemplates.WELCOME.template,
            context: {
                name: userDoc.name,
            }
        }).catch(emailError => {
            logger.error("Error sending welcome email", {
                userId: userDoc._id,
                email: userDoc.email,
                error: emailError.message,
                stack: emailError.stack
            });
        });
        let accessToken;
        if (isLogin === 'true') {
            const sessionId = uuidv4();
            await redis.set(`user:${userDoc._id}:session`, sessionId, "EX", 30 * 24 * 60 * 60);
            const refreshToken = generateToken({ userId: userDoc._id, sessionId }, config.REFRESH_TOKEN_EXPIRY);
            res.cookie("refresh_token", refreshToken, {
                httpOnly: true,
                secure: config.NODE_ENV === "production",
                sameSite: config.NODE_ENV === "production" ? "none" : "lax",
                domain: config.NODE_ENV === "production" ? `.${config.DOMAIN.replace(/^\./, "")}` : "localhost",
                path: "/",
            });
            accessToken = generateToken({ userId: userDoc._id, sessionId }, config.JWT_EXPIRATION);
            res.redirect(`${storedData.redirect}/email-verified?token=${accessToken}&success=true`);
            return;
        } else {
            res.redirect(`${storedData.redirect}/email-verified?sueccess=true`);
            return;
        }
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        logger.error("Error during email verification", error);
        next(error);
    }
}

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || typeof email !== 'string' || email.trim().length === 0) {
            throw new ApiError(400, "Email is required", "EMAIL_REQUIRED", "Please provide a valid email address");
        }
        if (!password || typeof password !== 'string') {
            throw new ApiError(400, "Password is required", "PASSWORD_REQUIRED", "Please provide your password");
        }
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            throw new ApiError(404, "User not found", "USER_NOT_FOUND", "No account found with the provided email");
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid credentials", "INVALID_CREDENTIALS", "The email or password you entered is incorrect");
        }
        const sessionId = uuidv4();
        await redis.set(`user:${user._id}:session`, sessionId, "EX", 30 * 24 * 60 * 60);
        const refreshToken = generateToken({ userId: user._id, sessionId }, config.REFRESH_TOKEN_EXPIRY);
        res.cookie("refresh_token", refreshToken, {
            httpOnly: true,
            secure: config.NODE_ENV === "production",
            sameSite: config.NODE_ENV === "production" ? "none" : "lax",
            domain: config.NODE_ENV === "production" ? `.${config.DOMAIN.replace(/^\./, "")}` : "localhost",
        });
        const accessToken = generateToken({ userId: user._id, sessionId }, config.JWT_EXPIRATION);
        res.json({ user, accessToken });
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        logger.error("Error during user login", error);
        next(error);
    }
}

exports.refreshToken = async (req, res, next) => {
    try {
        console.log(req.cookies)
        const { refresh_token } = req.cookies;
        if (!refresh_token) {
            throw new ApiError(401, "Refresh token missing", "TOKEN_MISSING", "Please log in again");
        }
        const jwt = require('jsonwebtoken');
        let payload;
        try {
            payload = jwt.verify(refresh_token, config.SECRET);
        } catch (tokenError) {
            throw new ApiError(401, "Invalid refresh token", "INVALID_TOKEN", "Please log in again");
        }
        const { userId, sessionId } = payload;
        const storedSessionId = await redis.get(`user:${userId}:session`);
        if (storedSessionId !== sessionId) {
            throw new ApiError(401, "Session invalid or expired", "SESSION_INVALID", "Please log in again");
        }
        const newAccessToken = generateToken({ userId, sessionId }, config.JWT_EXPIRATION);
        res.status(200).json({
            success: true,
            message: "Access token refreshed successfully",
            accessToken: newAccessToken
        });
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        logger.error("Error during token refresh", error);
        next(error);
    }
}