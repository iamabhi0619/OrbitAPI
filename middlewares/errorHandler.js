const ApiError = require("../utils/ApiError");


const errorHandler = (err, req, res, next) => {
    if (!(err instanceof ApiError)) {
        err = new ApiError(500, "Internal Server Error", "INTERNAL_ERROR");
    }
    res.status(err.status).json({
        success: false,
        status: err.status,
        message: err.message,
        error: {
            code: err.code,
            details: err.details || null,
        },
    });
};

module.exports = errorHandler;
