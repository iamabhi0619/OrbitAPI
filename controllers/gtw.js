const gtw = require("../model/gtw");
const Word = require("../model/gtwWord");
const logger = require("../service/logging");
const User = require("../model/user");

const { getRandomWord, scoreUpdate, updateHints, provideHint } = require("../utility/gtw");
const ApiError = require("../utility/ApiError");

exports.getProgress = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch the user progress from the database
    let data = await gtw
      .findOne({ user: userId })
      .select("-questions -history -current -seenWords -createdAt -updatedAt")
      .populate("user", "name avatar gender settings email");

    // If no progress exists, create a new entry for the user
    if (!data) {
      const mainUser = await User.findById(userId).select("name avatar");
      if (!mainUser) {
        return next(new ApiError(404, "User not found", "USER_NOT_FOUND", "The user does not exist."));
      }

      data = await gtw.create({ user: userId });
      await data.save();

      const userObject = {
        ...data.toObject(),
        name: mainUser.name,
        avatar: mainUser.avatar,
      };

      return res.status(201).json({
        success: true,
        message: "New user progress created successfully.",
        user: userObject,
      });
    }

    // Update hints for the user
    updateHints(data);
    await data.save();

    const responseData = {
      user: {
        name: data.user.name,
        avatar: data.user.avatar,
        gender: data.user.gender,
        settings: data.user.settings,
        email: data.user.email,
      },
      score: {
        correctGuesses: data.correctGuesses,
        totalSkipped: data.totalSkipped,
        totalHintsUsed: data.totalHintsUsed,
        points: data.points,
        score: data.score,
        currentLevel: data.currentLevel,
        hintsLeft: data.hints.hintsLeft,
        questionsSolved: data.questionsSolved,
      }
    }


    res.status(200).json({
      success: true,
      message: "User progress retrieved successfully.",
      data: responseData,
    });
  } catch (error) {
    logger.error(`Error fetching progress for GTW: ${error.message}`);
    next(new ApiError(500, "Internal Server Error", "PROGRESS_FETCH_ERROR", error.message));
  }
};

// Get User History
exports.getHistory = async (req, res, next) => {
  try {
    const user = await gtw.findOne({ user: req.user._id });
    if (!user || !user.history) {
      return next(new ApiError(404, "No history found", "HISTORY_NOT_FOUND", "No history found for this user."));
    }

    if (user.history.length === 0) {
      return res.status(200).json({
        success: false,
        message: "User has not completed any activities yet.",
      });
    }

    res.status(200).json({
      success: true,
      message: "User history retrieved successfully.",
      history: user.history.reverse(),
    });
  } catch (error) {
    logger.error(`Error fetching history from GTW: ${error.message}`);
    next(new ApiError(500, "Internal Server Error", "HISTORY_FETCH_ERROR", error.message));
  }
};

// Get a Word for the User
exports.getWord = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await gtw.findOne({ user: userId });

    if (!user) {
      return next(new ApiError(404, "User not found", "USER_NOT_FOUND", "No user found."));
    }

    if (user.current && Object.keys(user.current).length > 0 && !user.current.isSolved) {
      return res.status(200).json({ success: true, word: user.current });
    }

    const level = user.currentLevel || Math.floor(Math.random() * 6) + 1;
    const word = await getRandomWord(level, user.seenWords);

    user.current = word;
    user.seenWords.push(word.wordId);
    await user.save();

    res.status(200).json({ success: true, word });
  } catch (error) {
    logger.error(`Error fetching word from GTW: ${error.message}`);
    next(new ApiError(500, "Internal Server Error", "WORD_FETCH_ERROR", error.message));
  }
};

// Check User's Word Guess
exports.checkWord = async (req, res, next) => {
  try {
    const { guess, time } = req.body;
    if (!guess) {
      return next(new ApiError(400, "Invalid input", "GUESS_REQUIRED", "Please provide a word to guess."));
    }
    const userId = req.user._id;
    const user = await gtw.findOne({ user: userId });
    if (!user) {
      return next(new ApiError(404, "User not found", "USER_NOT_FOUND", "User not found."));
    }
    if (!user.current || !user.current.wordId || user.current.isSolved) {
      return next(new ApiError(400, "No active word", "NO_ACTIVE_WORD", "No active word to guess. Please get a new word."));
    }
    const actualWord = await Word.findOne({ wordId: user.current.wordId });
    if (!actualWord) {
      logger.error(`Word not found for wordId: ${user.current.wordId}`);
      return next(new ApiError(404, "Word not found", "WORD_NOT_FOUND", "The word associated with this game is missing."));
    }
    const normalizedGuess = guess.trim().toLowerCase();
    const normalizedActualWord = actualWord.word.trim().toLowerCase();
    const isCorrect = normalizedGuess === normalizedActualWord;
    await scoreUpdate(user, isCorrect, actualWord.word, actualWord.meaning, time);
    const word = {
      ...user.current,
      meaning: isCorrect ? actualWord.meaning : undefined,
      originalWord: isCorrect ? actualWord.word : undefined,
    };
    await user.markModified("current");
    await user.save();

    const score = {
      correctGuesses: user.correctGuesses,
      totalSkipped: user.totalSkipped,
      totalHintsUsed: user.totalHintsUsed,
      points: user.points,
      score: user.score,
      currentLevel: user.currentLevel,
      hintsLeft: user.hints.hintsLeft,
      questionsSolved: user.questionsSolved,
    }

    res.status(200).json({
      success: true,
      guess: isCorrect,
      message: isCorrect
        ? "🎉 Congratulations! Your guess is correct."
        : "❌ Incorrect guess. Try again!",
      word,
      score
    });
  } catch (error) {
    logger.error(`Error checking word from GTW: ${error.message}`);
    next(new ApiError(500, "Internal Server Error", "WORD_CHECK_ERROR", error.message));
  }
};

// Get a Hint for the Current Word
exports.getHint = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await gtw.findOne({ user: userId });

    if (!user || !user.current || user.current.isSolved) {
      return next(new ApiError(400, "No active word", "NO_ACTIVE_WORD", "No active word to get a hint for."));
    }

    const actualWord = await Word.findOne({ wordId: user.current.wordId });

    if (!actualWord) {
      return next(new ApiError(404, "Word not found", "WORD_NOT_FOUND", "Word not found."));
    }

    updateHints(user);

    if (user.hints.hintsLeft <= 0) {
      return res.status(200).json({
        success: false,
        message: "No hints left. Come back later when hints regenerate!",
      });
    }

    const hintsUsed = 3 - user.hints.hintsLeft + 1;
    const hint = provideHint(actualWord, hintsUsed);

    user.hints.hintsLeft -= 1;
    user.hints.lastHintUsedAt = Date.now();
    await user.save();

    res.status(200).json({ success: true, hint, hintsLeft: user.hints.hintsLeft });
  } catch (error) {
    logger.error(`Error getting hint: ${error.message}`);
    next(new ApiError(500, "Internal Server Error", "HINT_FETCH_ERROR", error.message));
  }
};
