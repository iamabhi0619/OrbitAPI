const { isValidRedirect } = require("../../utils/auth/valid-redirect");
const ApiError = require("../../utils/ApiError");
const config = require('../../config/index');
const crypto = require('crypto');
const passport = require('../../config/passport');
const redis = require("../../config/redis");
const { v4: uuidv4 } = require('uuid');

const generateToken = (payload, expiresIn) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(payload, config.SECRET, { expiresIn });
};

exports.GoogleOAuthV1 = async (req, res, next) => {
    try {
        const redirect = req.query.redirect || config.CLIENT_URL;
        if (!isValidRedirect(redirect, config.DOMAIN)) {
            throw new ApiError(400, "Invalid redirect URL", "INVALID_REDIRECT_URL", "The provided redirect URL is not valid.");
        }
        const stateObj = {
            id: crypto.randomBytes(12).toString('hex'),
            redirect,
        }
        const state = Buffer.from(JSON.stringify(stateObj)).toString('base64');

        passport.authenticate('google', {
            scope: ['profile', 'email'],
            state: state,
        })(req, res, next);

    } catch (error) {
        next(error);
    }
}

exports.GoogleOAuthCallbackV1 = async (req, res, next) => {
    try {
        const state = req.query.state;
        let redirect = config.CLIENT_URL;

        if (state) {
            try {
                const decodedState = Buffer.from(state, 'base64').toString('utf-8');
                const stateObj = JSON.parse(decodedState);
                if (stateObj.redirect && isValidRedirect(stateObj.redirect, config.DOMAIN)) {
                    redirect = stateObj.redirect;
                }
            } catch (stateError) {
                console.error('Error parsing state:', stateError);
            }
        }

        passport.authenticate('google', { session: false }, async (err, user, info) => {
            try {
                if (err) {
                    console.error('OAuth authentication error:', err);
                    return res.redirect(`${redirect}?error=OAuthFailed&message=${encodeURIComponent(err.message || 'Authentication failed')}`);
                }

                if (!user) {
                    return res.redirect(`${redirect}?error=OAuthFailed&message=${encodeURIComponent('User authentication failed')}`);
                }

                // Generate session and tokens
                const sessionId = uuidv4();
                await redis.set(`user:${user._id}:session`, sessionId, "EX", 30 * 24 * 60 * 60); // 30 days

                const refreshToken = generateToken({ userId: user._id, sessionId }, config.REFRESH_TOKEN_EXPIRY);
                const accessToken = generateToken({ userId: user._id, sessionId }, config.JWT_EXPIRATION);

                // Set refresh token in httpOnly cookie
                res.cookie("refresh_token", refreshToken, {
                    httpOnly: true,
                    secure: config.NODE_ENV === "production",
                    sameSite: config.NODE_ENV === "production" ? "none" : "lax",
                    domain: config.NODE_ENV === "production" ? `.${config.DOMAIN.replace(/^\./, "")}` : "localhost",
                    path: "/",
                    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
                });

                // Redirect with access token
                return res.redirect(`${redirect}?token=${accessToken}&success=true`);
            } catch (callbackError) {
                console.error('Error in OAuth callback:', callbackError);
                return res.redirect(`${redirect}?error=OAuthFailed&message=${encodeURIComponent('An error occurred during authentication')}`);
            }
        })(req, res, next);
    } catch (error) {
        console.error('Error in GoogleOAuthCallbackV1:', error);
        next(error);
    }
}

exports.GoogleOAuthFailureV1 = async (req, res, next) => {
    try {
        throw new ApiError(400, "Google OAuth failed", "GOOGLE_OAUTH_FAILED", "Authentication with Google OAuth failed.");
    } catch (error) {
        next(error);
    }
}