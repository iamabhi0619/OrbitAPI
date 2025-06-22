// const Word = require("../model/gtwWord");
// const logger = require("../service/logging");
// const moment = require("moment");

const mongoose = require("mongoose");
const Word = require("../../model/GuessTheWord/word");
const logger = require("../../config/logger");


const MAX_SEEN_WORDS = 1000;


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


const getRandomWord = async (level, seenWords = [], scorecard) => {
    try {


        if (scorecard.currentQuestion && !scorecard.currentQuestion.isSolved && !scorecard.currentQuestion.isSkipped) {
            return scorecard.currentQuestion;
        }

        if (seenWords.length > MAX_SEEN_WORDS) {
            seenWords = seenWords.slice(-MAX_SEEN_WORDS);
        }
        const seenIds = seenWords.map(id => new mongoose.Types.ObjectId(id));
        const [word] = await Word.aggregate([
            { $match: { level, _id: { $nin: seenIds } } },
            { $sample: { size: 1 } },
        ]);
        if (!word) {
            return { success: false, message: "No words available at this level." };
        }

        let scrambledWord;
        do {
            scrambledWord = scrambleWords(word.word);
        } while (scrambledWord === word.word);
        const data = {
            wordId: word._id,
            scrambledWord: scrambledWord,
            difficulty: word.level
        }
        scorecard.currentQuestion = { ...data };
        scorecard.seenWords.push(word._id);
        scorecard.history.push(data);
        await scorecard.save();

        return scorecard.currentQuestion;
    } catch (error) {
        logger.error(`Error fetching random word: ${error}`);
        return null;
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
                time: time,
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
                user.questionsSolved.easy = (user.questionsSolved.easy || 0) + 1;
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
        return `It starts with "${actualWord.word[0]}" and ends with "${actualWord.word[actualWord.word.length - 1]
            }".`;
    } else {
        let revealedWord = actualWord.word
            .split("")
            .map((char, index) => (index % 2 === 0 ? char : "_"))
            .join("");

        return `It starts with "${actualWord.word[0]}" and ends with "${actualWord.word[actualWord.word.length - 1]
            }". Partial word: "${revealedWord}"`;
    }
};


const updateAchievements = (scorecard, newlyUnlocked, allAchievements) => {
    if (!Array.isArray(newlyUnlocked) || newlyUnlocked.length === 0) return;

    // STEP 1: Get already existing keys in user's scorecard
    const existingKeys = new Set(scorecard.achievements.map(a => a.key));

    // STEP 2: Filter out only new achievements not already present
    const filteredNew = newlyUnlocked.filter(a => !existingKeys.has(a.key));
    if (filteredNew.length === 0) return;

    // STEP 3: Add filtered new ones
    scorecard.achievements.push(...filteredNew);

    // STEP 4: Deduplicate achievements by `key` (robust way)
    const uniqueMap = new Map();
    for (const ach of scorecard.achievements) {
        if (!uniqueMap.has(ach.key)) {
            uniqueMap.set(ach.key, ach);
        }
    }
    scorecard.achievements = Array.from(uniqueMap.values());

    // STEP 5: Create a priority map for sorting
    const priorityMap = Object.fromEntries(
        allAchievements.map(a => [a.key, a.priority || 0])
    );

    // STEP 6: Sort achievements by descending priority
    scorecard.achievements.sort((a, b) => {
        const priorityA = priorityMap[a.key] || 0;
        const priorityB = priorityMap[b.key] || 0;
        return priorityB - priorityA;
    });
};


module.exports = {
    getRandomWord,
    checkGuess,
    scoreUpdate,
    updateHints,
    provideHint,
    updateAchievements,
};
