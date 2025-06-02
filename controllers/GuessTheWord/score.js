const GTWScorecard = require("../../model/GuessTheWord/score");
const ApiError = require("../../utils/ApiError.js");
const logger = require("../../config/logger.js");
const { getRandomWord } = require("../../utils/GuessTheWord/word.js");
// const { getRandomWord, scoreUpdate, updateHints, provideHint } = require("../../utils/GuessTheWord/word");

exports.getScorecard = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const scorecard = await GTWScorecard.findOne({ user: userId });

        if (!scorecard) {
            return next(new ApiError(404, "Scorecard not found", "SCORECARD_NOT_FOUND", "No scorecard exists for the user."));
        }

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

        res.status(201).json({ success: true, message: "Scorecard created", scorecard });
    } catch (error) {
        logger.error("Error creating scorecard: " + error.message);
        next(new ApiError(500, "Failed to create scorecard", "SCORECARD_CREATE_ERROR", "An error occurred while creating the scorecard."));
    }
};

exports.getRandomWord = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const scorecard = await GTWScorecard.findOne({ user: userId });

        if (!scorecard) {
            return next(new ApiError(404, "Scorecard not found", "SCORECARD_NOT_FOUND", "No scorecard exists for the user."));
        }

        if (scorecard.currentLevel < 1 || scorecard.currentLevel > 6) {
            return next(new ApiError(400, "Invalid level", "INVALID_LEVEL", "Current level must be between 1 and 6."));
        }

        if (scorecard.currentQuestion && !scorecard.currentQuestion.isSolved) {
            return next(new ApiError(400, "Current question not solved", "QUESTION_NOT_SOLVED", "You must solve the current question before fetching a new one."));
        }
        // Assuming getRandomWord is a utility function that fetches a random word
        const word = await getRandomWord(scorecard.currentLevel, scorecard.seenWords, scorecard);
        await scorecard.save();

        if (!word) {
            return next(new ApiError(404, "No words available", "NO_WORDS_AVAILABLE", "No words available for the current level."));
        }

        res.status(200).json({ success: true, message: "Random word fetched successfully", word });
    } catch (error) {
        logger.error("Error fetching random word: " + error.message);
        next(new ApiError(500, "Failed to get random word", "RANDOM_WORD_FETCH_ERROR", "An error occurred while retrieving a random word."));
    }
}