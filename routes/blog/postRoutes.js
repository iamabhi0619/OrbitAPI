const express = require("express");
const { createPost } = require("../../controllers/blog/postController");
const { verifyToken } = require("../../middleware/auth");
const Router = express.Router();

Router.post("/", verifyToken, createPost);

module.exports = Router;
