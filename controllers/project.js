const Project = require("../model/project");
const slugify = require("slugify");

// Create Project
exports.createProject = async (req, res) => {
  try {
    const {
      name,
      description_short,
      description_long,
      tech_stack,
      api_used,
      status,
      start_date,
      end_date,
      deployment_date,
      version,
      estimated_hours,
      budget,
      client,
      database,
      hosting,
      authentication,
      features,
      star_rating,
      roadmap,
      screenshots,
      change_log,
      github_repo,
      live_demo,
    } = req.body;

    // Generate a slug from the project name
    const slug = slugify(name, { lower: true });

    // Format tech_stack, api_used, features, and screenshots into arrays of strings
    const formattedTechStack = tech_stack.filter((item) => item.trim() !== "");
    const formattedApiUsed = api_used.split(",").map((a) => a.trim());
    const formattedFeatures = features.map((f) => f.trim());
    const formattedScreenshots = screenshots.map((s) => s.trim());
    // Format change_log correctly (ensure date is a valid Date object)
    const formattedChangeLog = change_log.map((log) => ({
      version: log.version,
      date: new Date(log.date),
      changes: log.changes,
    }));

    // Create a new project
    const project = new Project({
      name,
      description_short,
      description_long,
      tech_stack: formattedTechStack,
      api_used: formattedApiUsed,
      status,
      start_date,
      end_date,
      deployment_date,
      version,
      estimated_hours,
      budget,
      client,
      database,
      hosting,
      authentication,
      features: formattedFeatures,
      star_rating,
      roadmap,
      screenshots: formattedScreenshots,
      github_repo,
      live_demo,
      change_log: formattedChangeLog,
      slug, // Add the slug field
    });
    // Save the project to the database
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    console.log(error);

    res.status(400).json({ error: error.message });
  }
};

// Get All Projects
exports.getAllProject = async (req, res) => {
  try {
    const projects = await Project.find().sort({ star_rating: -1 });
    res.status(200).json({ status: "success", data: projects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Single Project by ID
exports.getSingleProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    project.user_reviews.sort((a, b) => b.important - a.important);
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Project
exports.updateProject = async (req, res) => {
  try {
    const {
      name,
      description_short,
      description_long,
      tech_stack,
      api_used,
      status,
      start_date,
      end_date,
      deployment_date,
      version,
      estimated_hours,
      budget,
      client,
      database,
      hosting,
      authentication,
      features,
      star_rating,
      user_reviews,
      roadmap,
      screenshots,
      change_log,
      github_repo,
      live_demo,
    } = req.body;

    // Format tech_stack, features, and screenshots into arrays of strings
    const formattedTechStack = tech_stack.filter((item) => item.trim() !== "");
    const formattedFeatures = features.map((f) => f.trim());
    const formattedScreenshots = screenshots.map((s) => s.trim());

    // Check if api_used is a string, if so, split it into an array
    const formattedApiUsed = Array.isArray(api_used)
      ? api_used
      : api_used.split(",").map((a) => a.trim());

    // Format change_log correctly and check for duplicates before appending
    const newChangeLog = change_log.map((log) => ({
      version: log.version,
      date: new Date(log.date),
      changes: log.changes,
    }));

    // Find the existing project by ID
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Check if the new change_log entries are already present
    const existingVersions = project.change_log.map((log) => log.version);
    const filteredChangeLog = newChangeLog.filter((log) => !existingVersions.includes(log.version));

    // Generate a slug from the project name
    const slug = slugify(name, { lower: true });

    // Update the project with the new data
    project.name = name;
    project.description_short = description_short;
    project.description_long = description_long;
    project.tech_stack = formattedTechStack;
    project.api_used = formattedApiUsed;
    project.status = status;
    project.start_date = start_date;
    project.end_date = end_date;
    project.deployment_date = deployment_date;
    project.version = version;
    project.estimated_hours = estimated_hours;
    project.budget = budget;
    project.client = client;
    project.database = database;
    project.hosting = hosting;
    project.authentication = authentication;
    project.features = formattedFeatures;
    project.star_rating = star_rating;
    project.user_reviews = user_reviews;
    project.roadmap = roadmap;
    project.screenshots = formattedScreenshots;
    project.github_repo = github_repo;
    project.live_demo = live_demo;
    project.slug = slug; // Add the slug field

    // Merge only new change_log entries with the existing ones
    if (filteredChangeLog.length > 0) {
      project.change_log = [...project.change_log, ...filteredChangeLog];
    }

    // Save the updated project
    await project.save();
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Project Summary
exports.getSummery = async (req, res) => {
  try {
    const projects = await Project.find();
    const total_project = projects.length;
    const statusCount = projects.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});
    res.status(200).json({ success: true, data: { total_project, statusCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addUserReview = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, review, important } = req.body;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    const newReview = {
      name,
      review,
      date: new Date(),
      important: important || false,
    };
    project.user_reviews.push(newReview);
    await project.save();
    res.status(201).json({ success: true, message: "Review added successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.markReviewAsImportant = async (req, res) => {
  try {
    const { projectId, reviewId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    const review = project.user_reviews.id(reviewId);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });
    review.important = true;
    await project.save();
    res.status(200).json({ success: true, message: "Review marked as important" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteUserReview = async (req, res) => {
  try {
    const { projectId, reviewId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    project.user_reviews = project.user_reviews.filter(
      (review) => review._id.toString() !== reviewId
    );
    await project.save();
    res.status(200).json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.uplodeSS = async (req, res) => {
  console.log(req.file);
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      url: req.file.path,
      fileName: req.file.originalname,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Upload failed", error: error.message });
  }
};
