const express = require("express");
const { verifyToken, isAdmin } = require("../../middleware/auth");
const { getAllTags, getTagsByUsageCount, getTagsByParent, getTagById, createTag, updateTag, deleteTag } = require("../../controllers/blog/tagController");
const Router = express.Router();


Router.get("/", getAllTags);
Router.get("/usage", getTagsByUsageCount);
Router.get("/parent/:parentId", getTagsByParent);
Router.get("/:id", getTagById);

// 🔒 Protected Routes
Router.post("/", verifyToken, createTag);
Router.put("/:id", verifyToken, isAdmin, updateTag);
Router.delete("/:id", verifyToken, isAdmin, deleteTag);

module.exports = Router;
