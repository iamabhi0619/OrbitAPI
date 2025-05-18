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
        logger.error("Create Project Error: ", err);
        next(new ApiError(500, "Failed to create project", "PROJECT_CREATION_FAILED", err.message));
    }
};

exports.getAllProject = async (req, res, next) => {
    try {
        const projects = await Project.find().sort({ star_rating: -1 });
        res.status(200).json({ success: true, data: projects });
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

        const formattedChangeLog = formatChangeLog(data.change_log);
        const existingVersions = project.change_log.map((log) => log.version);
        const newLogs = formattedChangeLog.filter((log) => !existingVersions.includes(log.version));

        Object.assign(project, {
            ...data,
            slug: slugify(data.name, { lower: true }),
            tech_stack: formatArray(data.tech_stack),
            api_used: formatCsv(data.api_used),
            features: formatArray(data.features),
            screenshots: formatArray(data.screenshots),
        });

        if (newLogs.length) {
            project.change_log.push(...newLogs);
        }

        await project.save();
        res.json({ success: true, message: "Project updated", data: project });
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
        res.json({ success: true, data: { total_project, statusCount } });
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

        project.user_reviews.push({ name, review, important: !!important, date: new Date() });
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