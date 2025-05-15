const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors"); // Import cors
const path = require("path");
const logger = require("./service/logging");
const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: "Too many requests, please try again later.",
  },
  headers: true,
});

// Import routes
const UserRoutes = require("./routes/user");
const userAuthRoutes = require("./routes/userRoutes/authRoutes");
const logRoutes = require("./routes/logRoutes");
const ContactRoutes = require("./routes/contact");
const AchievementRoutes = require("./routes/achievement");
const ProjectRoutes = require("./routes/project");
const GTWRoutes = require("./routes/gtw");
const UserAdminRoutes = require("./routes/userAdmin");
const certifications = require("./routes/certifications");
const newsletterRoutes = require("./routes/newsletterRoutes");
const blogRoutes = require("./routes/blogRoutes");
const errorHandler = require("./middleware/errorHandler");
const config = require("./config");

dotenv.config();
const app = express();
app.use(cors());
app.use(apiLimiter);
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


// MongoDB connection
mongoose
  .connect(config.DB_URL)
  .then(() => {
    logger.info("Database connected successfully");
  })
  .catch((err) => {
    logger.error(`Database connection error: ${err.message}`);
  });

// Define routes
app.get("/", (req, res) => {
  // res.sendFile(path.join(__dirname, "public", "index.html"));
  res.send("All good..!!");
});

app.use("/api/user", UserRoutes);
app.use("/api/auth", userAuthRoutes);
app.use("/api/user", UserRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/contact", ContactRoutes);
app.use("/api/achievements", AchievementRoutes);
app.use("/api/projects", ProjectRoutes);
app.use("/api/gtw", GTWRoutes);
app.use("/api/useradmin", UserAdminRoutes);
app.use("/api/certifications", certifications);
app.use("/api/newsletters", newsletterRoutes);


app.use("/api/blog", blogRoutes);


app.use(errorHandler);
// Start server
const port = config.PORT;
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
