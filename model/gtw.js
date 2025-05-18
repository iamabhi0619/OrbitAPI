const mongoose = require("mongoose");
const { Schema } = mongoose;

const gtwSchema = new Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    currentLevel: {
      type: Number,
      min: 1,
      max: 6,
      default: 1,
    },
    score: { type: Number, default: 0, min: 0, max: 100 },
    points: { type: Number, default: 0 },
    totalSkipped: { type: Number, default: 0 },
    totalHintsUsed: { type: Number, default: 0 },
    hints: {
      hintsLeft: { type: Number, default: 3 },
      lastHintUsedAt: { type: Date, default: Date.now },
    },
    questionsSolved: {
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 },
    },
    seenWords: [{ type: String }],
    current: { type: Schema.Types.Mixed, default: {} },
    history: [],
    correctGuesses: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("gtw", gtwSchema);
