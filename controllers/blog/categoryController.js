const TagCategory = require("../../model/blog/tagCategories.js");
const { default: slugify } = require("slugify");
const ApiError = require("../../utils/ApiError.js");
const logger = require("../../config/logger.js");

exports.createCategory = async (req, res, next) => {
    try {
        const { name, description, parent } = req.body;

        if (!name || !description) {
            return next(new ApiError(400, "Missing required fields.", "FIELDS_REQUIRED", "Please provide name and description."));
        }

        let baseSlug = slugify(name, { lower: true });
        let slug = baseSlug;
        let counter = 1;
        while (await TagCategory.findOne({ slug })) {
            slug = `${baseSlug}-${counter++}`;
        }
        const tagCategory = await TagCategory.create({
            name,
            description,
            slug,
            type: "category",
            parent
        });

        res.status(201).json({
            status: true,
            message: "Category created successfully.",
            data: {
                tagCategory,
            },
        });
    } catch (error) {
        logger.error("Error creating category: " + error);
        next(error);
    }
}

exports.getAllCategories = async (req, res, next) => {
    try {
        const categories = await TagCategory.find({ type: "category" }).sort({ usageCount: -1 }).sort({ createdAt: -1 });
        res.status(200).json({
            status: true,
            message: "Categories retrieved successfully.",
            categories

        });
    } catch (error) {
        next(error);
    }
}

exports.getCategoryById = async (req, res, next) => {
    try {
        const { id } = req.params;
        let category = await TagCategory.findOne({ slug: id });
        if (!category) {
            category = await TagCategory.findById(id);
        }
        if (!category) {
            return next(new ApiError(404, "Category not found.", "CATEGORY_NOT_FOUND", "No category found with the provided ID."));
        }
        res.status(200).json({
            status: true,
            message: "Category retrieved successfully.",
            category,

        });
    } catch (error) {
        if (error.name === "CastError") {
            return next(new ApiError(400, "Invalid category ID or Name.", "INVALID", "The provided category ID or Name is invalid."));
        }
        logger.error("Error retrieving category: " + error);
        next(error);
    }
}

exports.updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, parent } = req.body;

        const category = await TagCategory.findByIdAndUpdate(id, {
            name,
            description,
            parent,
            updatedAt: Date.now()
        }, { new: true });

        if (!category) {
            return next(new ApiError(404, "Category not found.", "CATEGORY_NOT_FOUND", "No category found with the provided ID."));
        }

        res.status(200).json({
            status: true,
            message: "Category updated successfully.",
            category,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return next(new ApiError(400, "Invalid category ID.", "INVALID", "The provided category ID is invalid."));
        }
        logger.error("Error updating category: " + error);
        next(error);
    }
}

exports.deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const category = await TagCategory.findByIdAndDelete(id);
        if (!category) {
            return next(new ApiError(404, "Category not found.", "CATEGORY_NOT_FOUND", "No category found with the provided ID."));
        }
        res.status(200).json({
            status: true,
            message: "Category deleted successfully.",
        });
    } catch (error) {
        if (error.name === "CastError") {
            return next(new ApiError(400, "Invalid category ID.", "INVALID", "The provided category ID is invalid."));
        }
        logger.error("Error deleting category: " + error);
        next(error);
    }
}

exports.getCategoryByParent = async (req, res, next) => {
    try {
        const { parentId } = req.params;
        const categories = await TagCategory.find({ parent: parentId });
        if (!categories || categories.length === 0) {
            return next(new ApiError(404, "No categories found.", "CATEGORIES_NOT_FOUND", "No categories found with the provided parent ID."));
        }
        res.status(200).json({
            status: "success",
            data: {
                categories,
            },
        });
    } catch (error) {
        next(error);
    }
}

exports.getCategoryByUsageCount = async (req, res, next) => {
    try {
        const categories = await TagCategory.find({}).sort({ usageCount: -1 });
        if (!categories || categories.length === 0) {
            return next(new ApiError(404, "No categories found.", "CATEGORIES_NOT_FOUND", "No categories found."));
        }
        res.status(200).json({
            status: "success",
            message: "Categories retrieved successfully.",
            categories,
        });
    } catch (error) {
        next(error);
    }
}