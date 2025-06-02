const Word = require("../../model/GuessTheWord/word");
const ApiError = require("../../utils/ApiError.js");
const logger = require("../../config/logger.js");
const slugify = require("slugify");

const getWordByIdOrSlug = async (param) => {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(param);
    return isObjectId
        ? await Word.findById(param)
        : await Word.findOne({ slug: param });
};

// GET ALL WORDS
exports.getWord = async (req, res, next) => {
    try {
        const words = await Word.find();
        if (!words || words.length === 0) {
            return next(new ApiError(404, "No words found", "WORDS_NOT_FOUND", "No words available for the game."));
        }
        res.status(200).json({
            success: true,
            message: "Words retrieved successfully.",
            words
        });
    } catch (error) {
        logger.error(`Error fetching words for GTW: ${error.message}`);
        next();
    }
};

// GET SINGLE WORD
exports.getSingleWord = async (req, res, next) => {
    try {
        const { id } = req.params;
        const word = await getWordByIdOrSlug(id);
        if (!word) {
            return next(new ApiError(404, "No such word available", "WORD_NOT_AVAILABLE", "Didn't find any word"));
        }
        res.status(200).json({
            success: true,
            message: "Word retrieved successfully.",
            word
        });
    } catch (error) {
        logger.error(`Error fetching single word for GTW: ${error.message}`);
        next(new ApiError(500, "Failed to fetch word", "WORD_FETCH_ERROR", error.message));
    }
};

// ADD WORD
exports.addWord = async (req, res, next) => {
    try {
        let { slug, word, hint, meaning, level, category, synonyms, antonyms, examples, language, tags, addedBy } = req.body;

        if (!word || !hint || !meaning || typeof level !== "number") {
            return next(new ApiError(400, "Missing required fields", "MISSING_FIELDS", "word, hint, meaning, and level are required."));
        }

        slug = slugify(slug || word, { lower: true, strict: true });

        const existing = await Word.findOne({ $or: [{ slug }, { word }] });
        if (existing) {
            return next(new ApiError(409, "Word or slug already exists", "DUPLICATE_WORD", "A word with this slug or word already exists."));
        }

        const newWord = new Word({ slug, word, hint, meaning, level, category, synonyms, antonyms, examples, language, tags, addedBy });
        await newWord.save();

        res.status(201).json({
            success: true,
            message: "Word added successfully.",
            word: newWord
        });
    } catch (error) {
        logger.error(`Error adding word for GTW: ${error.message}`);
        next(new ApiError(500, "Failed to add word", "WORD_ADD_ERROR", error.message));
    }
};

// UPDATE WORD
exports.updateWord = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;

        if (updatedData.word) {
            updatedData.slug = slugify(updatedData.slug || updatedData.word, { lower: true, strict: true });
        }

        const updatedWord = await Word.findByIdAndUpdate(id, updatedData, { new: true });

        if (!updatedWord) {
            return next(new ApiError(404, "Word not found", "WORD_NOT_FOUND", "No word found with the given ID."));
        }

        res.status(200).json({
            success: true,
            message: "Word updated successfully.",
            word: updatedWord
        });
    } catch (error) {
        logger.error(`Error updating word: ${error.message}`);
        next(new ApiError(500, "Failed to update word", "WORD_UPDATE_ERROR", error.message));
    }
};

// DELETE WORD
exports.deleteWord = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deleted = await Word.findByIdAndDelete(id);

        if (!deleted) {
            return next(new ApiError(404, "Word not found", "WORD_NOT_FOUND", "No word found to delete."));
        }

        res.status(200).json({
            success: true,
            message: "Word deleted successfully.",
            word: deleted
        });
    } catch (error) {
        logger.error(`Error deleting word: ${error.message}`);
        next(new ApiError(500, "Failed to delete word", "WORD_DELETE_ERROR", error.message));
    }
};

// SEARCH WORDS
exports.searchWords = async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q) return next(new ApiError(400, "Missing search query", "MISSING_QUERY", "Search query is required."));
        if (q.length < 3) return next(new ApiError(400, "Search query too short", "SHORT_QUERY", "Search query must be at least 3 characters long."));


        const regex = new RegExp(q, 'i');
        const results = await Word.find({ $or: [{ word: regex }, { meaning: regex }, { hint: regex }] });

        res.status(200).json({
            success: true,
            message: "Search completed.",
            results
        });
    } catch (error) {
        logger.error(`Error searching words: ${error.message}`);
        next(new ApiError(500, "Search failed", "SEARCH_ERROR", error.message));
    }
};

// FILTER BY LEVEL OR CATEGORY
exports.filterWords = async (req, res, next) => {
    try {
        const { level, category } = req.query;
        const filter = {};

        if (level) filter.level = parseInt(level);
        if (category) filter.category = category;

        const words = await Word.find(filter);
        res.status(200).json({
            success: true,
            message: "Filtered words retrieved.",
            words
        });
    } catch (error) {
        logger.error(`Error filtering words: ${error.message}`);
        next(new ApiError(500, "Filtering failed", "FILTER_ERROR", error.message));
    }
};

exports.summery = async (req, res, next) => {
    try {
        // Total words
        const totalWords = await Word.countDocuments();

        // Words by level
        const wordsByLevel = await Word.aggregate([
            { $group: { _id: "$level", count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // Words by category
        const wordsByCategory = await Word.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Most common language
        const wordsByLanguage = await Word.aggregate([
            { $group: { _id: "$language", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        const mostCommonLanguage = wordsByLanguage.length > 0 ? wordsByLanguage[0]._id : "en";

        // Most played word
        const mostPlayedWord = await Word.findOne().sort({ timesPlayed: -1 });

        // Average success rate
        const avgSuccess = await Word.aggregate([
            { $group: { _id: null, avg: { $avg: "$successRate" } } }
        ]);
        const averageSuccessRate = avgSuccess[0] ? avgSuccess[0].avg.toFixed(2) : "0.00";

        // Top 5 tags
        const tagsAgg = await Word.aggregate([
            { $unwind: "$tags" },
            { $group: { _id: "$tags", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        const topTags = tagsAgg.map(t => ({ tag: t._id, count: t.count }));

        res.status(200).json({
            success: true,
            message: "Summary generated successfully.",
            summary: {
                totalWords,
                wordsByLevel,
                wordsByCategory,
                mostCommonLanguage,
                mostPlayedWord: mostPlayedWord ? {
                    word: mostPlayedWord.word,
                    timesPlayed: mostPlayedWord.timesPlayed,
                    successRate: mostPlayedWord.successRate
                } : null,
                averageSuccessRate,
                topTags
            }
        });
    } catch (error) {
        logger.error(`Error generating summary for GTW: ${error.message}`);
        next(new ApiError(500, "Failed to generate summary", "SUMMARY_ERROR", error.message));
    }
};