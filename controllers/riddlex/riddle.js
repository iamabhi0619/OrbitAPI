const { Riddle, DIFFICULTY_LEVELS, RIDDLE_CATEGORIES, RIDDLE_STATUS } = require("../../model/riddlex/riddle");
const ApiError = require("../../utils/ApiError.js");
const logger = require("../../config/logger.js");


const getRiddleByIdOrSlug = async (param) => {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(param);
    return isObjectId
        ? await Riddle.findById(param)
        : await Riddle.findOne({ slug: param });
};


exports.getAllRiddles = async (req, res, next) => {
    try {
        const { 
            level, 
            category, 
            page = 1, 
            limit = 10, 
            sort = 'createdAt', 
            order = 'desc',
            status
        } = req.query;

        // Build filter object
        const filter = {};
        if (level) filter.level = parseInt(level);
        if (category) filter.category = category;
        if (status) filter.status = status;

        // Pagination setup
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        // Sort setup
        const sortOrder = order === 'asc' ? 1 : -1;
        const sortObj = { [sort]: sortOrder };

        // Execute query with pagination
        const [riddles, totalCount] = await Promise.all([
            Riddle.find(filter)
                .sort(sortObj)
                .skip(skip)
                .limit(limitNum)
                .select('-__v'),
            Riddle.countDocuments(filter)
        ]);

        // if (!riddles || riddles.length === 0) {
        //     return next(new ApiError(404, "No riddles found", "RIDDLES_NOT_FOUND", "No riddles available with the specified criteria."));
        // }

        const totalPages = Math.ceil(totalCount / limitNum);

        res.status(200).json({
            success: true,
            message: "Riddles retrieved successfully.",
            data: {
                riddles,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalCount,
                    hasNextPage: pageNum < totalPages,
                    hasPrevPage: pageNum > 1
                }
            }
        });
    } catch (error) {
        logger.error(`Error fetching riddles: ${error.message}`);
        next(new ApiError(500, "Failed to fetch riddles", "RIDDLES_FETCH_ERROR", error.message));
    }
};


exports.getSingleRiddle = async (req, res, next) => {
    try {
        const { id } = req.params;
        const riddle = await getRiddleByIdOrSlug(id);
        
        if (!riddle) {
            return next(new ApiError(404, "Riddle not found", "RIDDLE_NOT_FOUND", "No riddle found with the specified ID or slug."));
        }

        // Don't expose answers in the response for security
        const riddleResponse = riddle.toObject();
        delete riddleResponse.answer;
        delete riddleResponse.alternativeAnswers;

        res.status(200).json({
            success: true,
            message: "Riddle retrieved successfully.",
            data: {
                riddle: riddleResponse
            }
        });
    } catch (error) {
        logger.error(`Error fetching single riddle: ${error.message}`);
        next(new ApiError(500, "Failed to fetch riddle", "RIDDLE_FETCH_ERROR", error.message));
    }
};


exports.addRiddle = async (req, res, next) => {
    try {
        // Handle bulk upload
        if (Array.isArray(req.body)) {
            const riddlesToAdd = req.body;
            const results = [];

            for (const item of riddlesToAdd) {
                try {
                    const { questionId, level, category, question, answer, hint, tags, alternativeAnswers, additionalHints, createdBy } = item;

                    // Validate required fields
                    if (!level || !category || !question || !answer || !hint) {
                        results.push({ 
                            success: false, 
                            questionId: questionId || 'unknown', 
                            error: "Missing required fields: level, category, question, answer, hint" 
                        });
                        continue;
                    }

                    // Validate multilingual content
                    const requiredLanguages = ['English', 'Hindi', 'Hinglish'];
                    const missingLanguages = requiredLanguages.filter(lang => 
                        !question[lang] || !answer[lang] || !hint[lang]
                    );

                    if (missingLanguages.length > 0) {
                        results.push({ 
                            success: false, 
                            questionId: questionId || 'unknown', 
                            error: `Missing content for languages: ${missingLanguages.join(', ')}` 
                        });
                        continue;
                    }

                    // Check for existing riddle
                    if (questionId) {
                        const existing = await Riddle.findOne({ questionId });
                        if (existing) {
                            results.push({ 
                                success: false, 
                                questionId, 
                                error: "Question ID already exists" 
                            });
                            continue;
                        }
                    }

                    const newRiddle = new Riddle({
                        questionId,
                        level,
                        category,
                        question,
                        answer,
                        hint,
                        tags: tags || [],
                        alternativeAnswers: alternativeAnswers || {},
                        additionalHints: additionalHints || {},
                        createdBy
                    });

                    await newRiddle.save();
                    results.push({ success: true, riddle: newRiddle });

                } catch (error) {
                    results.push({ 
                        success: false, 
                        questionId: item.questionId || 'unknown', 
                        error: error.message 
                    });
                }
            }

            return res.status(201).json({
                success: true,
                message: "Bulk riddle addition completed.",
                data: {
                    results,
                    summary: {
                        total: riddlesToAdd.length,
                        successful: results.filter(r => r.success).length,
                        failed: results.filter(r => !r.success).length
                    }
                }
            });
        }

        // Single riddle addition
        const { questionId, level, category, question, answer, hint, tags, alternativeAnswers, additionalHints, createdBy } = req.body;

        // Validate required fields
        if (!level || !category || !question || !answer || !hint) {
            return next(new ApiError(400, "Missing required fields", "MISSING_FIELDS", "level, category, question, answer, and hint are required."));
        }

        // Validate multilingual content
        const requiredLanguages = ['English', 'Hindi', 'Hinglish'];
        const missingLanguages = requiredLanguages.filter(lang => 
            !question[lang] || !answer[lang] || !hint[lang]
        );

        if (missingLanguages.length > 0) {
            return next(new ApiError(400, "Missing multilingual content", "MISSING_LANGUAGES", `Content required for: ${missingLanguages.join(', ')}`));
        }

        // Check for existing riddle
        if (questionId) {
            const existing = await Riddle.findOne({ questionId });
            if (existing) {
                return next(new ApiError(409, "Question ID already exists", "DUPLICATE_QUESTION_ID", "A riddle with this question ID already exists."));
            }
        }

        const newRiddle = new Riddle({
            questionId,
            level,
            category,
            question,
            answer,
            hint,
            tags: tags || [],
            alternativeAnswers: alternativeAnswers || {},
            additionalHints: additionalHints || {},
            createdBy
        });

        await newRiddle.save();

        res.status(201).json({
            success: true,
            message: "Riddle added successfully.",
            data: {
                riddle: newRiddle
            }
        });

    } catch (error) {
        logger.error(`Error adding riddle: ${error.message}`);
        next(new ApiError(500, "Failed to add riddle", "RIDDLE_ADD_ERROR", error.message));
    }
};


exports.updateRiddle = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updatedData = { ...req.body };

        // Add lastModifiedBy if provided
        if (req.user) {
            updatedData.lastModifiedBy = req.user.id;
        }

        // Remove sensitive fields that shouldn't be updated directly
        delete updatedData._id;
        delete updatedData.__v;
        delete updatedData.createdAt;
        delete updatedData.updatedAt;

        const updatedRiddle = await Riddle.findByIdAndUpdate(
            id, 
            updatedData, 
            { 
                new: true, 
                runValidators: true 
            }
        );

        if (!updatedRiddle) {
            return next(new ApiError(404, "Riddle not found", "RIDDLE_NOT_FOUND", "No riddle found with the given ID."));
        }

        res.status(200).json({
            success: true,
            message: "Riddle updated successfully.",
            data: {
                riddle: updatedRiddle
            }
        });

    } catch (error) {
        logger.error(`Error updating riddle: ${error.message}`);
        next(new ApiError(500, "Failed to update riddle", "RIDDLE_UPDATE_ERROR", error.message));
    }
};

exports.deleteRiddle = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deleted = await Riddle.findByIdAndDelete(id);

        if (!deleted) {
            return next(new ApiError(404, "Riddle not found", "RIDDLE_NOT_FOUND", "No riddle found to delete."));
        }

        res.status(200).json({
            success: true,
            message: "Riddle deleted successfully.",
            data: {
                riddle: deleted
            }
        });

    } catch (error) {
        logger.error(`Error deleting riddle: ${error.message}`);
        next(new ApiError(500, "Failed to delete riddle", "RIDDLE_DELETE_ERROR", error.message));
    }
};

exports.searchRiddles = async (req, res, next) => {
    try {
        const { q, level, category, page = 1, limit = 10 } = req.query;

        if (!q) {
            return next(new ApiError(400, "Missing search query", "MISSING_QUERY", "Search query is required."));
        }

        if (q.length < 3) {
            return next(new ApiError(400, "Search query too short", "SHORT_QUERY", "Search query must be at least 3 characters long."));
        }

        // Build search filter
        const filter = {
            $text: { $search: q },
            status: 'published'
        };

        if (level) filter.level = parseInt(level);
        if (category) filter.category = category;

        // Pagination
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const [results, totalCount] = await Promise.all([
            Riddle.find(filter, { score: { $meta: 'textScore' } })
                .sort({ score: { $meta: 'textScore' } })
                .skip(skip)
                .limit(limitNum)
                .select('-answer -alternativeAnswers -__v'),
            Riddle.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            message: "Search completed successfully.",
            data: {
                results,
                searchQuery: q,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalCount / limitNum),
                    totalCount
                }
            }
        });

    } catch (error) {
        logger.error(`Error searching riddles: ${error.message}`);
        next(new ApiError(500, "Search failed", "SEARCH_ERROR", error.message));
    }
};

exports.getSummary = async (req, res, next) => {
    try {
        // Total riddles by status
        const totalsByStatus = await Riddle.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        // Total published riddles
        const totalPublished = await Riddle.countDocuments({ status: 'published' });

        // Riddles by difficulty level
        const riddlesByLevel = await Riddle.aggregate([
            { $match: { status: 'published' } },
            { $group: { _id: "$level", count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // Riddles by category
        const riddlesByCategory = await Riddle.aggregate([
            { $match: { status: 'published' } },
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Most attempted riddle
        const mostAttempted = await Riddle.findOne({ status: 'published' })
            .sort({ 'stats.totalAttempts': -1 })
            .select('questionId question.English stats');

        // Average success rate
        const avgSuccessAgg = await Riddle.aggregate([
            { $match: { status: 'published', 'stats.totalAttempts': { $gt: 0 } } },
            { 
                $group: { 
                    _id: null, 
                    avgSuccessRate: { 
                        $avg: { 
                            $multiply: [
                                { $divide: ["$stats.correctSolves", "$stats.totalAttempts"] },
                                100
                            ]
                        }
                    }
                }
            }
        ]);
        const averageSuccessRate = avgSuccessAgg[0]?.avgSuccessRate?.toFixed(2) || "0.00";

        // Top tags
        const topTags = await Riddle.aggregate([
            { $match: { status: 'published' } },
            { $unwind: "$tags" },
            { $group: { _id: "$tags", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Recent activity
        const recentRiddles = await Riddle.find({ status: 'published' })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('questionId question.English level category createdAt');

        res.status(200).json({
            success: true,
            message: "Summary generated successfully.",
            data: {
                summary: {
                    totalsByStatus: totalsByStatus.reduce((acc, item) => {
                        acc[item._id] = item.count;
                        return acc;
                    }, {}),
                    totalPublished,
                    riddlesByLevel: riddlesByLevel.map(item => ({
                        level: item._id,
                        levelText: ['', 'Easy', 'Medium', 'Hard', 'Expert', 'Master'][item._id],
                        count: item.count
                    })),
                    riddlesByCategory,
                    mostAttempted: mostAttempted ? {
                        questionId: mostAttempted.questionId,
                        question: mostAttempted.question.English,
                        totalAttempts: mostAttempted.stats.totalAttempts,
                        successRate: mostAttempted.successRate
                    } : null,
                    averageSuccessRate: `${averageSuccessRate}%`,
                    topTags: topTags.map(tag => ({
                        tag: tag._id,
                        count: tag.count
                    })),
                    recentRiddles
                }
            }
        });

    } catch (error) {
        logger.error(`Error generating riddles summary: ${error.message}`);
        next(new ApiError(500, "Failed to generate summary", "SUMMARY_ERROR", error.message));
    }
};

exports.getConfig = async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            message: "Configuration retrieved successfully.",
            data: {
                config: {
                    difficultyLevels: Object.entries(DIFFICULTY_LEVELS).map(([key, value]) => ({
                        key,
                        value,
                        label: key.charAt(0) + key.slice(1).toLowerCase()
                    })),
                    categories: RIDDLE_CATEGORIES,
                    status: RIDDLE_STATUS,
                    supportedLanguages: ['English', 'Hindi', 'Hinglish']
                }
            }
        });
    } catch (error) {
        logger.error(`Error getting configuration: ${error.message}`);
        next(new ApiError(500, "Failed to get configuration", "CONFIG_ERROR", error.message));
    }
};
