const passport = require("passport");
const config = require(".");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../model/user");
const crypto = require('crypto');
const logger = require("./logger");

passport.use(new GoogleStrategy({
    clientID: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    callbackURL: `${config.NODE_ENV === "production" ? `https://api.${config.DOMAIN}` : "http://localhost:5050"}/auth/v1/google/callback`,
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Extract user information from Google profile
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        const name = profile.displayName || 'User';
        const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

        if (!email) {
            return done(new Error('No email found in Google profile'), null);
        }

        // Check if user already exists
        let user = await User.findOne({ email: email.toLowerCase().trim() });

        if (user) {
            // Update last login and activity log
            user.lastLogin = new Date();
            user.activityLog.push({
                action: "User logged in via Google OAuth",
                timestamp: new Date(),
            });

            // Update avatar if not set
            if (!user.avatar && avatar) {
                user.avatar = avatar;
            }

            await user.save();
        } else {
            // Create new user
            const userId = `USR${Date.now()}${crypto.randomBytes(2).toString('hex')}`;
            const userAvatar = avatar || `https://api.dicebear.com/9.x/shapes/png?seed=${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

            user = new User({
                userId,
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password: crypto.randomBytes(32).toString('hex'), // Random password for OAuth users
                avatar: userAvatar,
                isVerified: true, // Auto-verify OAuth users
                activityLog: [
                    {
                        action: "User registered via Google OAuth",
                        timestamp: new Date(),
                    },
                ],
                lastLogin: new Date(),
            });

            await user.save();
        }

        return done(null, user);
    } catch (error) {
        logger.error("Error in Google OAuth strategy:", error);
        return done(error, null);
    }
}
));

module.exports = passport;