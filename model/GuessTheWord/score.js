const mongoose = require("mongoose");
const { Schema } = mongoose;

const hintsSchema = new Schema(
  {
    hintsLeft: { type: Number, default: 3, min: 0 },
    lastHintUsedAt: { type: Date, default: Date.now },
    dailyHintQuota: { type: Number, default: 3 },
    totalHintsGiven: { type: Number, default: 0 }
  },
  { _id: false }
);

const questionsSolvedSchema = new Schema(
  {
    easy: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    hard: { type: Number, default: 0 }
  },
  { _id: false }
);

const currentQuestionSchema = new Schema(
  {
    wordId: { type: Schema.Types.ObjectId, ref: "Word", required: true },
    attempts: { type: Number, default: 0 },
    usedHint: { type: Boolean, default: false },
    scrambledWord: { type: String, required: true },
    isSolved: { type: Boolean, default: false },
    isSkipped: { type: Boolean, default: false },
    difficulty: { type: Number, required: true, min: 1, max: 6 },
  },
  { _id: false }
);

const historyEntrySchema = new Schema(
  {
    wordId: { type: Schema.Types.ObjectId, ref: "Word", index: true },
    isSolved: { type: Boolean, index: true },
    usedHint: { type: Boolean, default: false },
    isSkipped: { type: Boolean, default: false },
    timeTaken: { type: Number }, // in seconds
    scoreGained: { type: Number, default: 0 },
    solvedAt: { type: Date, default: Date.now, index: true },
    attempts: { type: Number, default: 0 },
    scrambledWord: { type: String, required: true },
    difficulty: { type: Number, required: true, min: 1, max: 6 },
  },
  { _id: false }
);

const gtwSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    currentLevel: {
      type: Number,
      min: 1,
      max: 6,
      default: 1
    },

    score: { type: Number, default: 0, min: 0, max: 100 },
    points: { type: Number, default: 0 },
    totalSkipped: { type: Number, default: 0 },
    totalHintsUsed: { type: Number, default: 0 },
    correctGuesses: { type: Number, default: 0 },

    streak: {
      current: { type: Number, default: 0 },
      best: { type: Number, default: 0 },
      lastReset: { type: Date, default: Date.now }
    },

    hints: hintsSchema,
    questionsSolved: questionsSolvedSchema,

    seenWords: [{
      type: Schema.Types.ObjectId,
      ref: "Word",
      index: true
    }],

    currentQuestion: currentQuestionSchema,

    history: {
      type: [historyEntrySchema],
      default: []
    },

    levelsCompleted: {
      type: [Number],
      default: []
    },

    achievements: {
      type: [String],
      default: []
    }

  },
  { timestamps: true }
);

gtwSchema.index({ "history.wordId": 1, "history.solved": 1, "history.solvedAt": -1 });

module.exports = mongoose.model("GTWScorecard", gtwSchema);
