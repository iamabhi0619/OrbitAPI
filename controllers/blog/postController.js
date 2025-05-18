const mongoose = require("mongoose");
const Post = require("../../model/Blog/post.model");
const logger = require("../../service/logging");
const ApiError = require("../../utility/ApiError");
const slugify = require("slugify");

exports.createPost = async (req, res, next) => {
    try {
        const { title, content, category, tags = [], media = [] } = req.body;

        // Required fields check
        if (!title || !content || !category) {
            return next(
                new ApiError(
                    400,
                    "Missing required fields.",
                    "FIELDS_REQUIRED",
                    "Please provide title, content, and category."
                )
            );
        }

        // Validate category and tags as ObjectId
        if (!mongoose.Types.ObjectId.isValid(category)) {
            return next(
                new ApiError(400, "Invalid category ID.", "INVALID_CATEGORY")
            );
        }

        if (!Array.isArray(tags)) {
            return next(
                new ApiError(400, "Tags must be an array.", "INVALID_TAGS_FORMAT")
            );
        }

        for (let tagId of tags) {
            if (!mongoose.Types.ObjectId.isValid(tagId)) {
                return next(new ApiError(400, `Invalid tag ID: ${tagId}`, "INVALID_TAG"));
            }
        }

        // Generate unique slug
        let baseSlug = slugify(title, { lower: true });
        let slug = baseSlug;
        let counter = 1;
        while (await Post.findOne({ slug })) {
            slug = `${baseSlug}-${counter++}`;
        }

        // Validate media format
        if (!Array.isArray(media)) {
            return next(
                new ApiError(400, "Media must be an array.", "INVALID_MEDIA_FORMAT")
            );
        }

        for (const item of media) {
            if (!item.url || !item.type) {
                return next(
                    new ApiError(
                        400,
                        "Each media item must include 'url' and 'type'.",
                        "INVALID_MEDIA_ITEM"
                    )
                );
            }
            if (!["image", "video"].includes(item.type)) {
                return next(
                    new ApiError(
                        400,
                        `Invalid media type '${item.type}'.`,
                        "INVALID_MEDIA_TYPE"
                    )
                );
            }
        }

        const newPost = new Post({
            title,
            content,
            slug,
            author: req.user._id,
            category,
            tags,
            media,
            status: "draft", // default status
            publishedAt: null,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await newPost.save();

        res.status(201).json({
            success: true,
            message: "Post created successfully.",
            post: newPost,
        });
    } catch (error) {
        logger.error("Error in createPost:", error);
        return next(
            new ApiError(
                500,
                "Failed to create post.",
                "POST_CREATION_ERROR",
                error.message
            )
        );
    }
};