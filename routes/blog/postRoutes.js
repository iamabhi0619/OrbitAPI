const express = require("express");
const { createPost } = require("../../controllers/blog/postController");
const { verifyToken } = require("../../middlewares/authMiddleware");
const Router = express.Router();

Router.post("/", verifyToken, createPost);

module.exports = Router;
