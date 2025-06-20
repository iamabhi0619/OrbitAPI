const GTWScorecard = require("../../model/GuessTheWord/score");
const ApiError = require("../../utils/ApiError.js");
const logger = require("../../config/logger.js");
const { updateHint } = require("../../utils/GuessTheWord/hint.js");

exports.getScorecard = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const scorecard = await GTWScorecard.findOne({ user: userId }).select("-__v -createdAt -updatedAt -history -dailyStats -seenWords");
        if (!scorecard) {
            return next(new ApiError(404, "Scorecard not found", "SCORECARD_NOT_FOUND", "No scorecard exists for the user."));
        }
        await updateHint(scorecard);
        res.status(200).json({ success: true, message: "Scorecard fetched successfully", scorecard });
    } catch (error) {
        logger.error("Error fetching scorecard: " + error.message);
        next(new ApiError(500, "Failed to get scorecard", "SCORECARD_FETCH_ERROR", "An error occurred while retrieving the scorecard."));
    }
};

exports.createScorecard = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const existing = await GTWScorecard.findOne({ user: userId });

        if (existing) {
            return next(new ApiError(400, "Scorecard already exists", "SCORECARD_EXISTS", "You already have a scorecard."));
        }

        const scorecard = new GTWScorecard({ user: userId });
        await scorecard.save();
        const fresh = await GTWScorecard.findById(scorecard._id);

        res.status(201).json({ success: true, message: "Scorecard created", fresh });
    } catch (error) {
        logger.error("Error creating scorecard: " + error.message);
        next(new ApiError(500, "Failed to create scorecard", "SCORECARD_CREATE_ERROR", "An error occurred while creating the scorecard."));
    }
};