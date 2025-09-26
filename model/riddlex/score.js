const mongoose = require("mongoose");

// Simple question history schema
const questionHistorySchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Riddle',
    required: true
  },
  answeredAt: {
    type: Date,
    default: Date.now
  },
  isCorrect: {
    type: Boolean,
    required: true
  }
});

const scoreSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Simple scoring system
  scores: {
    totalScore: {
      type: Number,
      required: true,
      default: 0,
    },
    level: {
      type: Number,
      required: true,
      default: 1,
    },
    hintsUsed: {
      type: Number,
      required: true,
      default: 0,
    },
  },

  // Simple achievements
  achievements: [String],
  legendaryAchievements: [String],
  
  // Question tracking
  questionHistory: [questionHistorySchema],
  
  // Hint system
  availableHints: {
    type: Number,
    default: 3,
  },
  lastHintRenewal: {
    type: Date,
    default: Date.now,
  },
  
  // Current game state
  currentQuestion: {
    type: String,
    default: null,
  }
}, {
  timestamps: true
});

// Basic indexes for performance
scoreSchema.index({ userId: 1 });
scoreSchema.index({ 'scores.totalScore': -1 });

const Score = mongoose.model("Score", scoreSchema);

module.exports = Score;
