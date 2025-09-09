const rateLimit = require('express-rate-limit');

const rateLimitErrorResponse = (req, res, next, options) => {
    res.status(options.statusCode).json({
        success: false,
        status: options.statusCode,
        message: "Access denied",
        error: {
            code: "TOO_MANY_REQUESTS",
            details: options.message
        }
    });
};

// Sensitive endpoints (e.g., login, password reset) 1hrs -> 60
const sensitiveLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many attempts. Please try again in an hour.",
    statusCode: 429,
    handler: rateLimitErrorResponse
});

// General API limiter (all API endpoints) 15min -> 100
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again later.",
    statusCode: 429,
    handler: rateLimitErrorResponse
});

const statsLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again later.",
    statusCode: 429,
    handler: rateLimitErrorResponse
});


// Export all limiters
module.exports = {
    sensitiveLimiter,
    apiLimiter,
    statsLimiter
};