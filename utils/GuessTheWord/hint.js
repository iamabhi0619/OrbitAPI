const logger = require("../../config/logger");

/**
 * Updates the user's hints info based on daily quota and reset time.
 * Call this on user login or at the start of a new game session.
 *
 * @param {Object} user - Mongoose document of the user scorecard.
 * @param {boolean} forceReset - Optional. If true, force reset hints regardless of time.
 */
exports.updateHint = async (user, forceReset = false) => {
    try {
        if (!user || !user._id) {
            throw new Error("User object is required to update scorecard.");
        }

        // Ensure hints subdocument exists
        if (!user.hints) {
            user.hints = {
                hintsLeft: 3,
                dailyHintQuota: 3,
                hintResetAt: new Date(),
                totalHintsGiven: 0,
            };
        }

        const now = new Date();
        const lastReset = user.hints.hintResetAt || new Date(0);
        const hrsIn24 = 24 * 60 * 60 * 1000;

        if (forceReset || now - lastReset >= hrsIn24) {
            user.hints.hintsLeft = user.hints.dailyHintQuota;
            user.hints.hintResetAt = now;
            user.hints.totalHintsGiven = 0;
            // Optionally reset any other hint-related fields here
        }

        await user.save();
    } catch (error) {
        logger.error("Error updating hints: ", error);
        throw new Error(`Failed to update Hint: ${error.message}`);
    }
};
