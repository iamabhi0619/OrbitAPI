const express = require("express");
const Router = express.Router();

Router.use("/posts", require("./blog/postRoutes"));
Router.use("/categories", require("./blog/categoryRoutes"));
Router.use("/tags", require("./blog/tagRoutes"));

module.exports = Router;