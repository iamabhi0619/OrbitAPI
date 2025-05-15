const Tag = require("../../model/Blog/tagCategories.model");
const { default: slugify } = require("slugify");
const ApiError = require("../../utility/ApiError");
const logger = require("../../service/logging");

// Create a new tag
exports.createTag = async (req, res, next) => {
    try {
        const { name, description, parent } = req.body;

        if (!name || !description) {
            return next(new ApiError(400, "Missing required fields.", "FIELDS_REQUIRED", "Please provide both name and description."));
        }

        let baseSlug = slugify(name, { lower: true });
        let slug = baseSlug;
        let counter = 1;

        while (await Tag.findOne({ slug })) {
            slug = `${baseSlug}-${counter++}`;
        }

        const newTag = await Tag.create({
            name,
            description,
            slug,
            type: "tag",
            parent
        });

        res.status(201).json({
            status: true,
            message: "Tag created successfully.",
            tag: newTag,
        });
    } catch (error) {
        logger.error("Error creating tag: " + error);
        next(error);
    }
};

// Get all tags
exports.getAllTags = async (req, res, next) => {
    try {
        const tags = await Tag.find({ type: "tag" }).sort({ usageCount: -1, createdAt: -1 });

        res.status(200).json({
            status: true,
            message: "Tags retrieved successfully.",
            tags
        });
    } catch (error) {
        logger.error("Error retrieving all tags: " + error);
        next(error);
    }
};

// Get tag by slug or ID
exports.getTagById = async (req, res, next) => {
    try {
        const { id } = req.params;

        let tag = await Tag.findOne({ slug: id });
        if (!tag) tag = await Tag.findById(id);

        if (!tag) {
            return next(new ApiError(404, "Tag not found.", "TAG_NOT_FOUND", "No tag found with the provided ID or slug."));
        }

        res.status(200).json({
            status: true,
            message: "Tag retrieved successfully.",
            tag,
        });
    } catch (error) {
        logger.error("Error retrieving tag: " + error);
        if (error.name === "CastError") {
            return next(new ApiError(400, "Invalid tag ID or slug.", "INVALID_ID_OR_SLUG", "The provided tag ID or slug is invalid."));
        }
        next(error);
    }
};

// Update a tag
exports.updateTag = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, parent } = req.body;

        const updatedTag = await Tag.findByIdAndUpdate(id, {
            name,
            description,
            parent,
            updatedAt: Date.now()
        }, { new: true });

        if (!updatedTag) {
            return next(new ApiError(404, "Tag not found.", "TAG_NOT_FOUND", "No tag found with the provided ID."));
        }

        res.status(200).json({
            status: true,
            message: "Tag updated successfully.",
            tag: updatedTag,
        });
    } catch (error) {
        logger.error("Error updating tag: " + error);
        if (error.name === "CastError") {
            return next(new ApiError(400, "Invalid tag ID.", "INVALID_ID", "The provided tag ID is invalid."));
        }
        next(error);
    }
};

// Delete a tag
exports.deleteTag = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deletedTag = await Tag.findByIdAndDelete(id);

        if (!deletedTag) {
            return next(new ApiError(404, "Tag not found.", "TAG_NOT_FOUND", "No tag found with the provided ID."));
        }

        res.status(200).json({
            status: true,
            message: "Tag deleted successfully.",
            tag: deletedTag
        });
    } catch (error) {
        logger.error("Error deleting tag: " + error);
        if (error.name === "CastError") {
            return next(new ApiError(400, "Invalid tag ID.", "INVALID_ID", "The provided tag ID is invalid."));
        }
        next(error);
    }
};

// Get tags by parent ID
exports.getTagsByParent = async (req, res, next) => {
    try {
        const { parentId } = req.params;
        const tags = await Tag.find({ parent: parentId });

        if (!tags || tags.length === 0) {
            return next(new ApiError(404, "No tags found for this parent.", "TAGS_NOT_FOUND", "No tags found with the provided parent ID."));
        }

        res.status(200).json({
            status: true,
            message: "Tags retrieved successfully by parent.",
            tags,
        });
    } catch (error) {
        logger.error("Error retrieving tags by parent: " + error);
        next(error);
    }
};

// Get tags/categories sorted by usage count
exports.getTagsByUsageCount = async (req, res, next) => {
    try {
        const tags = await Tag.find({ type: "tag" }).sort({ usageCount: -1 });

        if (!tags || tags.length === 0) {
            return next(new ApiError(404, "No tags found.", "TAGS_NOT_FOUND", "No tags available."));
        }

        res.status(200).json({
            status: true,
            message: "Tags retrieved successfully by usage count.",
            tags,
        });
    } catch (error) {
        logger.error("Error retrieving tags by usage count: " + error);
        next(error);
    }
};
