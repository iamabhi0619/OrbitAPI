const express = require("express");
const { createCategory, updateCategory, deleteCategory, getCategoryByParent, getAllCategories, getCategoryById, getCategoryByUsageCount } = require("../../controllers/blog/categoryController");
const { verifyToken } = require("../../middlewares/authMiddleware");
const Router = express.Router();


Router.post("/", verifyToken, createCategory);
Router.get("/", getAllCategories);
Router.get("/analytics", getCategoryByUsageCount);
Router.get("/parent/:parentId", getCategoryByParent);
Router.get("/:id", getCategoryById);
Router.put("/:id", verifyToken, updateCategory);
Router.delete("/:id", verifyToken, deleteCategory);

module.exports = Router;
