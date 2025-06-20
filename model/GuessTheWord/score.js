const mongoose = require("mongoose");
const { Schema } = mongoose;

// Sub-schema: Hints
const hintsSchema = new Schema({
  hintsLeft: { type: Number, default: 3, min: 0 },
  lastHintUsedAt: { type: Date, default: Date.now },
  dailyHintQuota: { type: Number, default: 3 },
  hintResetAt: { type: Date, default: Date.now }, // Used to reset daily hints
  totalHintsGiven: { type: Number, default: 0 }
}, { _id: false });

// Sub-schema: Streak
const streakSchema = new Schema({
  current: { type: Number, default: 0 },
  best: { type: Number, default: 0 },
  lastReset: { type: Date, default: Date.now }
}, { _id: false });

// Sub-schema: Question Performance Summary (per level)
const levelProgressSchema = new Schema({
  questionsSolved: { type: Number, default: 0 },
  hintsUsed: { type: Number, default: 0 },
  correctGuesses: { type: Number, default: 0 },
  totalAttempts: { type: Number, default: 0 }
}, { _id: false });

// Sub-schema: Current Question
const currentQuestionSchema = new Schema({
  wordId: { type: Schema.Types.ObjectId, ref: "Word", required: true },
  attempts: { type: Number, default: 0 },
  usedHint: { type: Boolean, default: false },
  scrambledWord: { type: String, required: true },
  isSolved: { type: Boolean, default: false },
  isSkipped: { type: Boolean, default: false },
  difficulty: { type: Number, required: true, min: 1, max: 6 },
}, { _id: false });

// Sub-schema: History Entry
const historyEntrySchema = new Schema({
  wordId: { type: Schema.Types.ObjectId, ref: "Word", index: true },
  isSolved: { type: Boolean, index: true, default: false },
  usedHint: { type: Boolean, default: false },
  isSkipped: { type: Boolean, default: false },
  timeTaken: { type: Number }, // in seconds
  scoreGained: { type: Number, default: 0 },
  solvedAt: { type: Date, index: true },
  attempts: { type: Number, default: 0 },
  scrambledWord: { type: String, required: true },
  difficulty: { type: Number, required: true, min: 1, max: 6 }
}, { _id: false });

const achievementSchema = new Schema({
  key: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  subtitle: { type: String }
}, { _id: false });

// Sub-schema: Daily Stats
const dailyStatsSchema = new Schema({
  date: { type: Date, required: true },
  solved: { type: Number, default: 0 },
  attempts: { type: Number, default: 0 },
  hintsUsed: { type: Number, default: 0 }
}, { _id: false });

// Main GTWScorecard Schema
const gtwSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },

  currentLevel: { type: Number, min: 1, max: 6, default: 1 },
  unlockedLevels: { type: [Number], default: [1] },
  levelsCompleted: { type: [Number], default: [] },

  score: { type: Number, default: 0, min: 0, max: 100 },
  xp: { type: Number, default: 0 },
  points: { type: Number, default: 0 },

  totalQuestionsSolved: { type: Number, default: 0 },
  totalAttempts: { type: Number, default: 0 },
  totalHintsUsed: { type: Number, default: 0 },
  totalSkipped: { type: Number, default: 0 },
  correctGuesses: { type: Number, default: 0 },
  efficiency: { type: Number, default: 0 }, // percentage (calculated regularly)

  seenWords: [{ type: Schema.Types.ObjectId, ref: "Word", index: true }],

  currentQuestion: currentQuestionSchema,
  history: { type: [historyEntrySchema], default: [] },
  hints: hintsSchema,
  streak: streakSchema,

  levelProgress: {
    type: Map,
    of: levelProgressSchema,
    default: () => new Map()
  },

  dailyStats: { type: [dailyStatsSchema], default: [] },

  achievements: { type: [achievementSchema], default: [] },

  lastPlayedAt: { type: Date, default: Date.now },
  lastSkippedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexing (note: indexing inside arrays won't perform well on large datasets)
gtwSchema.index({ "history.wordId": 1, "history.isSolved": 1, "history.solvedAt": -1 });

// Limit history entries to a safe size
gtwSchema.pre("save", function (next) {
  if (!this.history) return next();
  if (this.history.length > 1000) {
    this.history = this.history.slice(-1000);
  }
  next();
});


gtwSchema.pre("save", function (next) {
  if (this.totalAttempts > 0) {
    this.efficiency = Math.round((this.correctGuesses / this.totalAttempts) * 100);
  } else {
    this.efficiency = 0;
  }
  next();
});

gtwSchema.pre("validate", function (next) {
  if (!this.hints) {
    this.hints = {};
  }
  next();
});
gtwSchema.pre("validate", function (next) {
  if (!this.streak) {
    this.streak = {};
  }
  next();
});

module.exports = mongoose.model("GTWScorecard", gtwSchema);
