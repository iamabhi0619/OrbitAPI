const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description_short: { type: String, required: true },
  description_long: { type: String, required: true },
  tech_stack: [String],
  api_used: [String],
  status: { type: String, default: "planned" },
  start_date: Date,
  end_date: Date,
  deployment_date: Date,
  version: String,
  estimated_hours: Number,
  budget: Number,
  client: String,
  database: String,
  hosting: String,
  authentication: String,
  features: [String],
  star_rating: Number,
  user_reviews: {
    type: [
      {
        name: { type: String, required: true },
        review: { type: String, required: true },
        date: { type: Date, default: Date.now },
        important: { type: Boolean, default: false },
      },
    ],
    default: [],
  },
  roadmap: String,
  screenshots: [String],
  github_repo: String,
  live_demo: String,
  change_log: [
    {
      version: { type: String, required: true },
      date: { type: Date, required: true },
      changes: { type: String, required: true },
    },
  ],
});

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
