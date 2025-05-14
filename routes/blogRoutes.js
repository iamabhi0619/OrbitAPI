const express = require("express");
const Router = express.Router();

Router.use("/posts", require("./blog/postRoutes"));
Router.use("/categories", require("./blog/categoryRoutes"));

module.exports = Router;