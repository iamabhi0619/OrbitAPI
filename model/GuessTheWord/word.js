const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const wordSchema = new Schema({
  slug: { type: String, required: true, unique: true },
  word: { type: String, required: true, unique: true },
  hint: { type: String, required: true },
  meaning: { type: String, required: true },
  level: { type: Number, required: true },
  category: { type: String, default: "general" },
  synonyms: { type: [String], default: [] },
  antonyms: { type: [String], default: [] },
  examples: { type: [String], default: [] },
  language: { type: String, default: "en" },
  tags: { type: [String], default: [] },
  addedBy: { type: String, default: "system" },
  timesPlayed: { type: Number, default: 0 },
  timesCorrect: { type: Number, default: 0 },
}, { timestamps: true });

const Word = mongoose.model("Word", wordSchema);

module.exports = Word;