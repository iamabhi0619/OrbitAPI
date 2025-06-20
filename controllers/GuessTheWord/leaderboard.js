const GTWScorecard = require("../../model/GuessTheWord/score");
const User = require("../../model/user.js");
const ApiError = require("../../utils/ApiError.js");
const logger = require("../../config/logger.js");

/**
 * Get the global leaderboard (top N by score)
 */
exports.globalLeaderboard = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const leaderboard = await GTWScorecard.find({})
            .sort({ score: -1, xp: -1 })
            .limit(limit)
            .populate("user", "username avatar");

        res.status(200).json({
            success: true,
            message: "Global leaderboard fetched",
            leaderboard
        });
    } catch (error) {
        logger.error("Error fetching global leaderboard: " + error.message);
        next(new ApiError(500, "Failed to fetch leaderboard", "LEADERBOARD_ERROR"));
    }
};


/**
 * Get the daily leaderboard (top N by today's solved count)
 */
exports.dailyLeaderboard = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Aggregate today's solved count for each user
        const leaderboard = await GTWScorecard.aggregate([
            { $unwind: "$dailyStats" },
            { $match: { "dailyStats.date": today } },
            {
                $project: {
                    user: 1,
                    solved: "$dailyStats.solved",
                    score: 1,
                    xp: 1
                }
            },
            { $sort: { solved: -1, score: -1, xp: -1 } },
            { $limit: limit }
        ]);

        // Populate user info
        const userIds = leaderboard.map(l => l.user);
        const users = await User.find({ _id: { $in: userIds } }).select("username avatar");
        const userMap = {};
        users.forEach(u => { userMap[u._id] = u; });

        leaderboard.forEach(l => {
            l.user = userMap[l.user] || {};
        });

        res.status(200).json({
            success: true,
            message: "Daily leaderboard fetched",
            leaderboard
        });
    } catch (error) {
        logger.error("Error fetching daily leaderboard: " + error.message);
        next(new ApiError(500, "Failed to fetch leaderboard", "LEADERBOARD_ERROR"));
    }
};

/**
 * Get leaderboard by custom field (e.g., xp, points)
 * Usage: /leaderboard/custom?field=xp&limit=10
 */
exports.customLeaderboard = async (req, res, next) => {
    try {
        const field = req.query.field || "score";
        const limit = parseInt(req.query.limit) || 20;
        const sortObj = {};
        sortObj[field] = -1;

        const leaderboard = await GTWScorecard.find({})
            .sort(sortObj)
            .limit(limit)
            .populate("user", "username avatar");

        res.status(200).json({
            success: true,
            message: `Leaderboard by ${field} fetched`,
            leaderboard
        });
    } catch (error) {
        logger.error("Error fetching custom leaderboard: " + error.message);
        next(new ApiError(500, "Failed to fetch leaderboard", "LEADERBOARD_ERROR"));
    }
};