const GTWScorecard = require("../../model/GuessTheWord/score.js");
const ApiError = require("../../utils/ApiError.js");
const logger = require("../../config/logger.js");
const { getRandomWord, updateAchievements } = require("../../utils/GuessTheWord/word.js");

const Word = require("../../model/GuessTheWord/word.js");
const { checkAchievements, determineCurrentLevel, calculateReward, achievements } = require("../../utils/GuessTheWord/achievements.js");

// const { getRandomWord, scoreUpdate, updateHints, provideHint } = require("../../utils/GuessTheWord/word");

const HINT_REWARD = {
    score: -5,
    xp: -2,
    points: -3
};

exports.getRandomWord = async (req, res, next) => {
    try {
        const userId = req?.user?._id;

        if (!userId) {
            return next(new ApiError(401, "Unauthorized", "UNAUTHORIZED", "User ID not found in request. Make sure you are logged in and sending a valid token."
            ));
        }

        const scorecard = await GTWScorecard.findOne({ user: userId });

        if (!scorecard) {
            return next(new ApiError(404, "Scorecard not found", "SCORECARD_NOT_FOUND", "No scorecard exists for the user. Please start a new game."
            ));
        }

        const currentLevel = scorecard.currentLevel;

        if (typeof currentLevel !== "number" || currentLevel < 1 || currentLevel > 6) {
            return next(new ApiError(400, "Invalid level", "INVALID_LEVEL", "Current level must be a number between 1 and 6. Please check your scorecard."
            ));
        }

        // Block fetching a new word if the current one is not solved or skipped
        const currentQ = scorecard.currentQuestion;
        if (currentQ && !currentQ.isSolved && !currentQ.isSkipped) {
            return res.status(200).json({
                success: true,
                message: "Solve or skip the previous question before fetching a new one.",
                word: currentQ,
            });
        }

        const seenWords = Array.isArray(scorecard.seenWords) ? scorecard.seenWords : [];

        const newWord = await getRandomWord(currentLevel, seenWords, scorecard);

        if (!newWord) {
            return next(new ApiError(
                404, "No words available", "NO_WORDS_AVAILABLE", "No unseen words available for the current level. Try another level or reset your progress."
            ));
        }
        scorecard.lastPlayedAt = new Date();
        await scorecard.save();
        res.status(200).json({
            success: true,
            message: "New random word fetched successfully.",
            word: scorecard.currentQuestion
        });

    } catch (error) {
        logger.error("Error in getRandomWord controller:", error);
        return next(new ApiError(500, "Failed to get random word", "RANDOM_WORD_FETCH_ERROR", "An unexpected error occurred while retrieving a random word. Please try again later."
        ));
    }
};

exports.checkWordGuess = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { guess } = req.body;

        if (!guess || typeof guess !== "string") {
            return next(new ApiError(400, "Invalid guess", "INVALID_GUESS", "Guess must be a non-empty string."
            ));
        }

        const scorecard = await GTWScorecard.findOne({ user: userId });
        if (!scorecard || !scorecard.currentQuestion) {
            return next(new ApiError(404, "No active question", "NO_ACTIVE_QUESTION", "There is no active question to guess. Please fetch a new word."
            ));
        }

        const current = scorecard.currentQuestion;
        if (current.isSolved || current.isSkipped) {
            return next(new ApiError(400, "You already solved the current Question.", "QUESTION_ALREADY_SOLVED", "You have already solved or skipped the current question. Please fetch a new word to continue."
            ));
        }

        const wordDoc = await Word.findById(current.wordId);
        if (!wordDoc) {
            return next(new ApiError(404, "Word not found", "WORD_NOT_FOUND", "The word for the current question could not be found in the database."
            ));
        }

        const isCorrect = guess.trim().toLowerCase() === wordDoc.word.trim().toLowerCase();

        // Always increment attempts
        current.attempts += 1;
        scorecard.totalAttempts += 1;

        if (!isCorrect) {
            scorecard.streak.current = 0;
            wordDoc.timesPlayed += 1;
            await wordDoc.save();
            await scorecard.save();
            return res.status(200).json({ success: true, correct: false, message: "Incorrect guess", attempts: current.attempts });
        }

        // ✅ Correct Answer Handling
        current.isSolved = true;
        scorecard.totalQuestionsSolved += 1;
        scorecard.correctGuesses += 1;

        const reward = calculateReward(current.difficulty, current.usedHint);
        scorecard.score += reward.score;
        scorecard.xp += reward.xp;
        scorecard.points += reward.points;

        // ✅ Update streak
        scorecard.streak.current += 1;
        scorecard.streak.best = Math.max(scorecard.streak.best, scorecard.streak.current);

        // ✅ Level progress
        const levelKey = current.difficulty.toString();
        const progress = scorecard.levelProgress.get(levelKey) || {
            questionsSolved: 0,
            hintsUsed: 0,
            correctGuesses: 0,
            totalAttempts: 0,
        };
        progress.questionsSolved += 1;
        progress.correctGuesses += 1;
        progress.totalAttempts += current.attempts;
        if (current.usedHint) progress.hintsUsed += 1;
        scorecard.levelProgress.set(levelKey, progress);

        // ✅ Level auto-upgrade
        const newLevel = determineCurrentLevel(scorecard.levelProgress);
        if (newLevel !== scorecard.currentLevel) {
            scorecard.currentLevel = newLevel;
            if (!scorecard.unlockedLevels.includes(newLevel)) {
                scorecard.unlockedLevels.push(newLevel);
            }
        }

        // ✅ Update history
        const entry = scorecard.history.find(h => h.wordId.toString() === current.wordId.toString() && !h.isSolved);
        if (entry) {
            entry.isSolved = true;
            entry.solvedAt = new Date();
            entry.scoreGained = reward.score;
            entry.attempts = current.attempts;
        }

        // ✅ Daily stats
        const today = new Date().toISOString().slice(0, 10);
        let todayStat = scorecard.dailyStats.find(s => s.date.toISOString().slice(0, 10) === today);
        if (!todayStat) {
            todayStat = { date: new Date(), solved: 0, attempts: 0, hintsUsed: 0 };
            scorecard.dailyStats.push(todayStat);
        }
        todayStat.solved += 1;
        todayStat.attempts += current.attempts;
        if (current.usedHint) todayStat.hintsUsed += 1;

        // ✅ Efficiency
        scorecard.efficiency = Math.round((scorecard.correctGuesses / scorecard.totalAttempts) * 100);

        // ✅ Achievements
        let newlyUnlocked = checkAchievements(scorecard);

        // Only add achievements that are not already present
        if (newlyUnlocked.length > 0) {
            updateAchievements(scorecard, newlyUnlocked, achievements);
        }


        await scorecard.save();

        return res.status(200).json({
            success: true,
            correct: true,
            message: "Correct guess!",
            reward,
            newlyUnlockedAchievements: newlyUnlocked, // Already sorted by priority
            currentStreak: scorecard.streak.current,
            word: {
                meaning: wordDoc.meaning,
                word: wordDoc.word,
                difficulty: wordDoc.difficulty,
                synonyms: wordDoc.synonyms,
                antonyms: wordDoc.antonyms,
                examples: wordDoc.examples,
                efficiency: (wordDoc.timesCorrect / wordDoc.timesPlayed) * 100 || 100,
            }
        });
    } catch (error) {
        logger.error("Error in checkWordGuess:" + error);
        next(new ApiError(500, "Internal error", "CHECK_GUESS_ERROR", error.message || "An unexpected error occurred while checking the guess."
        ));
    }
};

exports.useHint = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const scorecard = await GTWScorecard.findOne({ user: userId });
        if (!scorecard) {
            return next(new ApiError(404, "Scorecard not found", "SCORECARD_NOT_FOUND", "No scorecard exists for the user. Please start a new game."
            ));
        }

        const current = scorecard.currentQuestion;
        if (!current || current.isSolved || current.isSkipped) {
            return next(new ApiError(400, "No active question", "NO_ACTIVE_QUESTION", "There is no active question to use a hint on. Please fetch a new word."
            ));
        }

        if (scorecard.hints.hintsLeft <= 0) {
            return next(new ApiError(400, "No hints left", "NO_HINTS_LEFT", "You’ve used all your hints for today. Please try again tomorrow."
            ));
        }

        const wordDoc = await Word.findById(current.wordId);
        if (!wordDoc) {
            return next(new ApiError(404, "Word not found", "WORD_NOT_FOUND", "The word for the current question could not be found in the database."
            ));
        }

        const hintNumberUsed = 3 - scorecard.hints.hintsLeft + 1;
        let hintText = "";
        const word = wordDoc.word;

        if (hintNumberUsed === 1) {
            hintText = `The word starts with "${word[0].toUpperCase()}".`;
        } else if (hintNumberUsed === 2) {
            hintText = `Hint: ${wordDoc.hint}`;
        } else if (hintNumberUsed === 3) {
            const revealed = word
                .split("")
                .map((char, idx) => (idx % 2 === 0 ? char : "_"))
                .join("");
            hintText = `Partial reveal: ${revealed}`;
        }

        // Update hint usage
        scorecard.hints.hintsLeft -= 1;
        scorecard.hints.lastHintUsedAt = new Date();
        scorecard.hints.totalHintsGiven += 1;
        scorecard.totalHintsUsed += 1;

        // Mark hint used for current question
        current.usedHint = true;

        // Update rewards
        scorecard.score = Math.max(0, scorecard.score + HINT_REWARD.score);
        scorecard.xp += HINT_REWARD.xp;
        scorecard.points += HINT_REWARD.points;

        // Update levelProgress
        const levelKey = current.difficulty.toString();
        const progress = scorecard.levelProgress.get(levelKey) || {
            questionsSolved: 0,
            hintsUsed: 0,
            correctGuesses: 0,
            totalAttempts: 0
        };
        progress.hintsUsed += 1;
        scorecard.levelProgress.set(levelKey, progress);

        // Update current question in history
        const historyEntry = scorecard.history.find(
            (h) => h.wordId.toString() === current.wordId.toString() && !h.isSolved
        );
        if (historyEntry) {
            historyEntry.usedHint = true;
        }

        // Update dailyStats
        const today = new Date().toISOString().slice(0, 10);
        let daily = scorecard.dailyStats.find(stat => stat.date.toISOString().slice(0, 10) === today);
        if (!daily) {
            daily = { date: new Date(), solved: 0, attempts: 0, hintsUsed: 0 };
            scorecard.dailyStats.push(daily);
        }
        daily.hintsUsed += 1;

        await scorecard.save();

        return res.status(200).json({
            success: true,
            message: "Hint used successfully.",
            hint: hintText,
            hintsLeft: scorecard.hints.hintsLeft,
            rewardsDeducted: HINT_REWARD,
            currentStats: {
                score: scorecard.score,
                xp: scorecard.xp,
                points: scorecard.points,
                totalHintsUsed: scorecard.totalHintsUsed
            }
        });

    } catch (error) {
        console.error("Error in useHint:", error);
        next(new ApiError(500, "Failed to use hint", "HINT_USE_FAILED", error.message || "An unexpected error occurred while using a hint."
        ));
    }
};

exports.skipWord = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const scorecard = await GTWScorecard.findOne({ user: userId });
        if (!scorecard) {
            return next(new ApiError(404, "Scorecard not found", "SCORECARD_NOT_FOUND", "No scorecard exists for the user. Please start a new game."
            ));
        }

        const current = scorecard.currentQuestion;

        if (!current || current.isSolved || current.isSkipped) {
            return next(new ApiError(400, "No active question to skip", "NO_ACTIVE_QUESTION", "There is no active question to skip. Please fetch a new word."
            ));
        }

        const wordDoc = await Word.findById(current.wordId);
        if (!wordDoc) {
            return next(new ApiError(404, "Word not found", "WORD_NOT_FOUND", "The word for the current question could not be found in the database."
            ));
        }

        // Mark the question as skipped
        current.isSkipped = true;
        scorecard.totalSkipped += 1;
        scorecard.streak.current = 0;

        // Update level progress
        const levelKey = current.difficulty.toString();
        const progress = scorecard.levelProgress.get(levelKey) || {
            questionsSolved: 0,
            hintsUsed: 0,
            correctGuesses: 0,
            totalAttempts: 0,
        };

        if (current.usedHint) {
            progress.hintsUsed += 1;
        }
        progress.totalAttempts += current.attempts;

        scorecard.levelProgress.set(levelKey, progress);

        // Update daily stats
        const today = new Date().toISOString().slice(0, 10);
        let dailyEntry = scorecard.dailyStats.find(stat => stat.date.toISOString().slice(0, 10) === today);
        if (!dailyEntry) {
            dailyEntry = { date: new Date(), solved: 0, attempts: 0, hintsUsed: 0 };
            scorecard.dailyStats.push(dailyEntry);
        }
        dailyEntry.attempts += current.attempts;
        if (current.usedHint) dailyEntry.hintsUsed += 1;

        // Add to history
        scorecard.history.push({
            wordId: current.wordId,
            isSkipped: true,
            isSolved: false,
            usedHint: current.usedHint,
            attempts: current.attempts,
            scrambledWord: current.scrambledWord,
            difficulty: current.difficulty,
        });

        await wordDoc.updateOne({ $inc: { timesPlayed: 1 } });

        await scorecard.save();

        return res.status(200).json({
            success: true,
            message: "Word skipped successfully.",
            skippedWordId: current.wordId,
            totalSkipped: scorecard.totalSkipped,
            currentStreak: 0,
        });
    } catch (error) {
        logger.error("skipWord error:", error);
        next(new ApiError(500, "Failed to skip word", "SKIP_WORD_ERROR", error.message || "An unexpected error occurred while skipping the word."
        ));
    }
};