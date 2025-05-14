const gtw = require("../model/gtw");
const Word = require("../model/gtwWord");
const logger = require("../service/logging");
const moment = require("moment");

const scrambleWords = (word) => {
  let arr = word.split("");
  let n = arr.length;
  for (let pass = 0; pass < n * 2; pass++) {
    let i = Math.floor(Math.random() * n);
    let j = Math.floor(Math.random() * n);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
};

const getRandomWord = async (level, seenWords = []) => {
  try {
    let words = await Word.find({ level }).exec();
    if (Array.isArray(seenWords) && seenWords.length > 0) {
      words = words.filter((word) => !seenWords.includes(word.wordId));
    }
    if (words.length === 0) {
      return { success: false, message: "No words available at this level." };
    }
    const randomIndex = Math.floor(Math.random() * words.length);
    const randomWord = words[randomIndex];
    let scrambledWord;
    do {
      scrambledWord = scrambleWords(randomWord.word);
    } while (randomWord.word === scrambledWord);
    return {
      wordId: randomWord.wordId,
      scrambledWord: scrambledWord,
      isSolved: false,
      isSkipped: false,
      isHint: false,
      difficulty: randomWord.level,
      tries: 0,
    };
  } catch (error) {
    logger.error(`Error fetching random word: ${error}`);
    return "An error occurred while fetching the word.";
  }
};

const checkGuess = (actualWord, guessedWord) => {
  const normalizedActual = actualWord.trim().toLowerCase();
  const normalizedGuess = guessedWord.trim().toLowerCase();
  return normalizedActual === normalizedGuess;
};

const scoreUpdate = async (user, status, word, meaning, time) => {
  try {
    if (!user) {
      return;
    }
    const levelPoints = { 1: 5, 2: 10, 3: 15, 4: 15, 5: 20, 6: 20 };
    const levelThresholds = { 1: 10, 2: 15, 3: 20, 4: 20, 5: 20 };
    if (status) {
      user.current.isSolved = true;
      user.current.tries += 1;
      user.correctGuesses = (user.correctGuesses || 0) + 1;
      user.history.push({
        ...user.current,
        correctWord: word,
        meaning: meaning,
        time : time,
        timestamp: new Date(),
      });
      user.points = (user.points || 0) + (levelPoints[user.currentLevel] || 0);
      if (user.currentLevel >= 1 && user.currentLevel <= 2) {
        user.questionsSolved.easy = (user.questionsSolved.easy || 0) + 1;
      } else if (user.currentLevel >= 3 && user.currentLevel <= 4) {
        user.questionsSolved.medium = (user.questionsSolved.medium || 0) + 1;
      } else if (user.currentLevel >= 5 && user.currentLevel <= 6) {
        user.questionsSolved.hard = (user.questionsSolved.hard || 0) + 1;
      } else {
        user.questionsSolved.easy = (user.questionsSolved.easy || 0) + 1; // Default case
      }
      if (user.correctGuesses >= (levelThresholds[user.currentLevel] || 20)) {
        user.currentLevel = Math.min(user.currentLevel + 1, 6);
      }
      let totalTries = user.history.reduce((sum, h) => sum + h.tries, 0);
      let totalCorrect = user.history.length;
      user.score =
        totalTries > 0
          ? Math.min(100, Math.round((totalCorrect / totalTries) * 100))
          : 0;
    } else {
      user.current.tries += 1;
    }
    await user.save();
  } catch (error) {
    logger.error("Error updating score:", error);
    throw new Error("Error Updating the score");
  }
};

const updateHints = (user) => {
  if (!user.hints) {
    user.hints = { hintsLeft: 3, lastHintUsedAt: Date.now() };
    return;
  }
  const lastUsed = moment(user.hints.lastHintUsedAt);
  const hoursSinceUpdate = moment().diff(lastUsed, "hours");
  if (hoursSinceUpdate >= 24) {
    user.hints.hintsLeft = 3;
  }
  user.hints.lastHintUpdatedAt = Date.now();
};

const provideHint = (actualWord, hintsUsed) => {
  if (!actualWord || !actualWord.word) {
    return "Hint not available.";
  }
  if (hintsUsed === 1) {
    return actualWord.hint || "No hint available.";
  } else if (hintsUsed === 2) {
    return `It starts with "${actualWord.word[0]}" and ends with "${
      actualWord.word[actualWord.word.length - 1]
    }".`;
  } else {
    let revealedWord = actualWord.word
      .split("")
      .map((char, index) => (index % 2 === 0 ? char : "_"))
      .join("");

    return `It starts with "${actualWord.word[0]}" and ends with "${
      actualWord.word[actualWord.word.length - 1]
    }". Partial word: "${revealedWord}"`;
  }
};

module.exports = {
  getRandomWord,
  checkGuess,
  scoreUpdate,
  updateHints,
  provideHint,
};
