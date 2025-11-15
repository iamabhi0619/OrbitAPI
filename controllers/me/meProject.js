// controllers/projectController.js
const Project = require("../../model/project");
const slugify = require("slugify");
const ApiError = require("../../utils/ApiError");
const logger = require("../../config/logger");

// Helper for formatting arrays
const formatArray = (data) => Array.isArray(data) ? data.map((i) => i.trim()) : [];
const formatCsv = (data) => typeof data === "string" ? data.split(",").map((i) => i.trim()) : [];
const formatChangeLog = (logs) => logs?.map((log) => ({
    version: log.version,
    date: new Date(log.date),
    changes: log.changes,
})) || [];

const getProjectByIdOrSlug = async (param) => {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(param);
    return isObjectId
        ? await Project.findById(param)
        : await Project.findOne({ slug: param });
};


// Create Project
exports.createProject = async (req, res, next) => {
    try {
        const data = req.body;
        const project = new Project({
            ...data,
            slug: slugify(data.name, { lower: true }),
            tech_stack: formatArray(data.tech_stack),
            api_used: formatCsv(data.api_used),
            features: formatArray(data.features),
            screenshots: formatArray(data.screenshots),
            change_log: formatChangeLog(data.change_log),
        });
        await project.save();
        res.status(201).json({ success: true, message: "Project created", data: project });
    } catch (err) {
        if (err.name === "ValidationError") {
            return next(new ApiError(400, "Invalid project data", "INVALID_PROJECT_DATA", err.message));
        }
        if (err.code === 11000) {
            return next(new ApiError(409, "Project already exists", "PROJECT_EXISTS", "A project with this name or slug already exists."));
        }
        logger.error("Project Creation Error: ", err);
        next(new ApiError(500, "Failed to create project", "PROJECT_CREATION_FAILED", err.message));
    }
};

exports.getAllProject = async (req, res, next) => {
    try {
        const {
            // Search parameters
            search,
            name,
            
            // Filter parameters
            status,
            tech_stack,
            database,
            hosting,
            authentication,
            client,
            category,
            
            // Rating filters
            min_rating,
            max_rating,
            
            // Date filters
            start_date_from,
            start_date_to,
            end_date_from,
            end_date_to,
            deployment_date_from,
            deployment_date_to,
            
            // Budget filters
            min_budget,
            max_budget,
            
            // Hour filters
            min_hours,
            max_hours,
            
            // Sorting
            sort_by = 'star_rating',
            sort_order = 'desc',
            
            // Pagination
            page = 1,
            limit = 10,
            
            // Field selection
            fields
        } = req.query;

        // Build filter object
        const filter = {};

        // Search functionality
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filter.$or = [
                { name: searchRegex },
                { description_short: searchRegex },
                { description_long: searchRegex },
                { tech_stack: { $in: [searchRegex] } },
                { features: { $in: [searchRegex] } },
                { client: searchRegex }
            ];
        }

        // Specific name search
        if (name) {
            filter.name = new RegExp(name, 'i');
        }

        // Status filter
        if (status) {
            if (Array.isArray(status)) {
                filter.status = { $in: status };
            } else {
                filter.status = status;
            }
        }

        // Tech stack filter
        if (tech_stack) {
            if (Array.isArray(tech_stack)) {
                filter.tech_stack = { $in: tech_stack.map(tech => new RegExp(tech, 'i')) };
            } else {
                filter.tech_stack = new RegExp(tech_stack, 'i');
            }
        }

        // Database filter
        if (database) {
            filter.database = new RegExp(database, 'i');
        }

        // Hosting filter
        if (hosting) {
            filter.hosting = new RegExp(hosting, 'i');
        }

        // Authentication filter
        if (authentication) {
            filter.authentication = new RegExp(authentication, 'i');
        }

        // Client filter
        if (client) {
            filter.client = new RegExp(client, 'i');
        }

        // Rating filters
        if (min_rating || max_rating) {
            filter.star_rating = {};
            if (min_rating) filter.star_rating.$gte = parseFloat(min_rating);
            if (max_rating) filter.star_rating.$lte = parseFloat(max_rating);
        }

        // Date filters
        if (start_date_from || start_date_to) {
            filter.start_date = {};
            if (start_date_from) filter.start_date.$gte = new Date(start_date_from);
            if (start_date_to) filter.start_date.$lte = new Date(start_date_to);
        }

        if (end_date_from || end_date_to) {
            filter.end_date = {};
            if (end_date_from) filter.end_date.$gte = new Date(end_date_from);
            if (end_date_to) filter.end_date.$lte = new Date(end_date_to);
        }

        if (deployment_date_from || deployment_date_to) {
            filter.deployment_date = {};
            if (deployment_date_from) filter.deployment_date.$gte = new Date(deployment_date_from);
            if (deployment_date_to) filter.deployment_date.$lte = new Date(deployment_date_to);
        }

        // Budget filters
        if (min_budget || max_budget) {
            filter.budget = {};
            if (min_budget) filter.budget.$gte = parseFloat(min_budget);
            if (max_budget) filter.budget.$lte = parseFloat(max_budget);
        }

        // Hour filters
        if (min_hours || max_hours) {
            filter.estimated_hours = {};
            if (min_hours) filter.estimated_hours.$gte = parseFloat(min_hours);
            if (max_hours) filter.estimated_hours.$lte = parseFloat(max_hours);
        }

        // Sorting
        const sortObj = {};
        const validSortFields = ['name', 'star_rating', 'start_date', 'end_date', 'deployment_date', 'budget', 'estimated_hours', 'createdAt', 'updatedAt'];
        if (validSortFields.includes(sort_by)) {
            sortObj[sort_by] = sort_order === 'asc' ? 1 : -1;
        } else {
            sortObj.star_rating = -1; // Default sort
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Field selection
        let selectFields = '';
        if (fields) {
            selectFields = fields.split(',').join(' ');
        }

        // Execute query with filters, sorting, and pagination
        const query = Project.find(filter);
        
        if (selectFields) {
            query.select(selectFields);
        }
        
        const projects = await query
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum);

        // Get total count for pagination
        const totalProjects = await Project.countDocuments(filter);
        const totalPages = Math.ceil(totalProjects / limitNum);

        // Response with pagination metadata
        res.status(200).json({
            success: true,
            message: "Projects retrieved successfully",
            data: projects,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalProjects,
                projectsPerPage: limitNum,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            },
            filters: {
                applied: Object.keys(req.query).length > 0,
                count: Object.keys(filter).length
            }
        });
    } catch (err) {
        logger.error("Get All Projects Error: ", err);
        next(new ApiError(500, "Failed to fetch projects", "FETCH_PROJECTS_FAILED", err.message));
    }
};

exports.getSingleProject = async (req, res, next) => {
    try {
        const project = await getProjectByIdOrSlug(req.params.id);
        if (!project) return next(new ApiError(404, "Project not found", "PROJECT_NOT_FOUND"));
        project.user_reviews.sort((a, b) => b.important - a.important);
        res.json({ success: true, data: project });
    } catch (err) {
        logger.error("Get Single Project Error: ", err);
        next(new ApiError(500, "Failed to fetch project", "FETCH_SINGLE_PROJECT_FAILED", err.message));
    }
};

exports.updateProject = async (req, res, next) => {
    try {
        const data = req.body;
        const project = await getProjectByIdOrSlug(req.params.id);
        if (!project) return next(new ApiError(404, "Project not found", "PROJECT_NOT_FOUND", "No such Project found."));
        // Prepare formatted fields
        const formattedChangeLog = formatChangeLog(data.change_log);
        const existingVersions = (project.change_log || []).map((log) => log.version);
        const newLogs = formattedChangeLog.filter((log) => !existingVersions.includes(log.version));


        // Build the update object. Use $set for regular fields and $push for new change_log entries
        const setFields = {
            ...data,
            slug: slugify(data.name || project.name, { lower: true }),
            tech_stack: formatArray(data.tech_stack ?? project.tech_stack),
            api_used: formatCsv(data.api_used ?? project.api_used),
            features: formatArray(data.features ?? project.features),
            screenshots: formatArray(data.screenshots ?? project.screenshots),
        };

        // Remove undefined keys from setFields to avoid overwriting with undefined
        Object.keys(setFields).forEach((k) => setFields[k] === undefined && delete setFields[k]);

        // If we are pushing new change_log entries, ensure change_log is not in $set
        if (newLogs.length) {
            delete setFields.change_log;
        }

        const update = { $set: setFields };
        if (newLogs.length) {
            update.$push = { change_log: { $each: newLogs } };
        }

        // Use atomic findByIdAndUpdate to avoid optimistic concurrency version errors
        const updated = await Project.findByIdAndUpdate(project._id, update, { new: true, runValidators: true });
        if (!updated) return next(new ApiError(404, "Project not found during update", "PROJECT_NOT_FOUND"));

        res.json({ success: true, message: "Project updated", data: updated });
    } catch (err) {
        logger.error("Update Project Error: ", err);
        next(new ApiError(500, "Failed to update project", "UPDATE_PROJECT_FAILED", err.message));
    }
};

exports.deleteProject = async (req, res, next) => {
    try {
        const project = await getProjectByIdOrSlug(req.params.id);
        if (!project) return next(new ApiError(404, "Project not found", "PROJECT_NOT_FOUND", "No such Project found."));
        res.json({ success: true, message: "Project deleted successfully" });
    } catch (err) {
        logger.error("Delete Project Error: ", err);
        next(new ApiError(500, "Failed to delete project", "DELETE_PROJECT_FAILED", err.message));
    }
};

exports.getSummery = async (req, res, next) => {
    try {
        const projects = await Project.find();
        const total_project = projects.length;
        const statusCount = projects.reduce((acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
        }, {});

        // Additional summary statistics
        const techStackStats = {};
        const databaseStats = {};
        const hostingStats = {};
        const authStats = {};
        
        projects.forEach(project => {
            // Tech stack statistics
            if (project.tech_stack && project.tech_stack.length > 0) {
                project.tech_stack.forEach(tech => {
                    techStackStats[tech] = (techStackStats[tech] || 0) + 1;
                });
            }
            
            // Database statistics
            if (project.database) {
                databaseStats[project.database] = (databaseStats[project.database] || 0) + 1;
            }
            
            // Hosting statistics
            if (project.hosting) {
                hostingStats[project.hosting] = (hostingStats[project.hosting] || 0) + 1;
            }
            
            // Authentication statistics
            if (project.authentication) {
                authStats[project.authentication] = (authStats[project.authentication] || 0) + 1;
            }
        });

        // Rating statistics
        const ratingsArray = projects.filter(p => p.star_rating).map(p => p.star_rating);
        const avgRating = ratingsArray.length > 0 ? 
            (ratingsArray.reduce((sum, rating) => sum + rating, 0) / ratingsArray.length).toFixed(2) : 0;

        // Budget statistics
        const budgetsArray = projects.filter(p => p.budget && p.budget > 0).map(p => p.budget);
        const totalBudget = budgetsArray.reduce((sum, budget) => sum + budget, 0);
        const avgBudget = budgetsArray.length > 0 ? (totalBudget / budgetsArray.length).toFixed(2) : 0;

        // Hours statistics
        const hoursArray = projects.filter(p => p.estimated_hours && p.estimated_hours > 0).map(p => p.estimated_hours);
        const totalHours = hoursArray.reduce((sum, hours) => sum + hours, 0);
        const avgHours = hoursArray.length > 0 ? (totalHours / hoursArray.length).toFixed(2) : 0;

        res.json({ 
            success: true, 
            data: { 
                total_project, 
                statusCount,
                techStackStats: Object.fromEntries(
                    Object.entries(techStackStats).sort(([,a], [,b]) => b - a).slice(0, 10)
                ),
                databaseStats,
                hostingStats,
                authStats,
                ratings: {
                    average: parseFloat(avgRating),
                    total_rated: ratingsArray.length
                },
                budget: {
                    total: totalBudget,
                    average: parseFloat(avgBudget),
                    projects_with_budget: budgetsArray.length
                },
                hours: {
                    total: totalHours,
                    average: parseFloat(avgHours),
                    projects_with_hours: hoursArray.length
                }
            } 
        });
    } catch (err) {
        logger.error("Get Summary Error: ", err);
        next(new ApiError(500, "Failed to fetch summary", "SUMMARY_FETCH_FAILED", err.message));
    }
};

exports.addUserReview = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { name, review, important } = req.body;
        const project = await getProjectByIdOrSlug(projectId);
        if (!project) return next(new ApiError(404, "Project not found", "PROJECT_NOT_FOUND", "No such Project found."));

        project.user_reviews.push({ name, review, important: !!important, date: new Date(), star: 3 });
        await project.save();
        res.status(201).json({ success: true, message: "Review added successfully" });
    } catch (err) {
        logger.error("Add Review Error: ", err);
        next(new ApiError(500, "Failed to add review", "ADD_REVIEW_FAILED", err.message));
    }
};

exports.markReviewAsImportant = async (req, res, next) => {
    try {
        const { projectId, reviewId } = req.params;
        const project = await getProjectByIdOrSlug(projectId);
        if (!project) return next(new ApiError(404, "Project not found", "PROJECT_NOT_FOUND", "No such Project found."));
        const review = project.user_reviews.id(reviewId);
        if (!review) return next(new ApiError(404, "Review not found", "REVIEW_NOT_FOUND", "No such Review found."));
        review.important = true;
        await project.save();
        res.json({ success: true, message: "Review marked as important" });
    } catch (err) {
        logger.error("Mark Review Error: ", err);
        next(new ApiError(500, "Failed to mark review", "MARK_REVIEW_FAILED", err.message));
    }
};

exports.deleteUserReview = async (req, res, next) => {
    try {
        const { projectId, reviewId } = req.params;
        const project = await getProjectByIdOrSlug(projectId);
        if (!project) return next(new ApiError(404, "Project not found", "PROJECT_NOT_FOUND", "No such Project found."));
        project.user_reviews = project.user_reviews.filter((r) => r._id.toString() !== reviewId);
        await project.save();
        res.json({ success: true, message: "Review deleted successfully" });
    } catch (err) {
        logger.error("Delete Review Error: ", err);
        next(new ApiError(500, "Failed to delete review", "DELETE_REVIEW_FAILED", err.message));
    }
};

exports.uploadScreenshot = async (req, res, next) => {
    try {
        if (!req.file) return next(new ApiError(400, "No file uploaded", "NO_FILE_UPLOADED", "Please upload a file."));
        res.status(200).json({
            success: true,
            message: "File uploaded successfully",
            url: req.file.path,
            fileName: req.file.originalname,
        });
    } catch (err) {
        logger.error("Screenshot Upload Error: ", err);
        next(new ApiError(500, "Upload failed", "UPLOAD_FAILED", err.message));
    }
};

exports.getAllReviews = async (req, res) => {
    try {
        const projects = await Project.find().select("name slug user_reviews");
        const reviews = [];

        projects.forEach((project) => {
            project.user_reviews.forEach((review) => {
                reviews.push({
                    project: {
                        name: project.name,
                        slug: project.slug,
                    },
                    ...review._doc,
                });
            });
        });

        res.status(200).json({
            success: true,
            message: "All project reviews fetched successfully.",
            count: reviews.length,
            reviews,
        });
    } catch (error) {
        logger.error("Error to getAllReviews: " + error);
        next(error);
    }
};

exports.getSingleProjectReviews = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await getProjectByIdOrSlug(id);
        if (!project) {
            return next(new ApiError(404, "Project not found", "PROJECT_NOT_FOUND", "No such Project found."));
        }
        const reviews = project.user_reviews || [];
        res.status(200).json({
            success: true,
            message: "Project reviews fetched successfully",
            project: {
                name: project.name,
                slug: project.slug,
            },
            count: reviews.length,
            reviews,
        });
    } catch (error) {
        logger.error("Error to getSingleProjectReviews: " + error)
        next(error);
    }
};