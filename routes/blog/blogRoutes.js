const express = require("express");
const Router = express.Router();

Router.use("/posts", require("./postRoutes"));
Router.use("/categories", require("./categoryRoutes"));
Router.use("/tags", require("./tagRoutes"));

module.exports = Router;