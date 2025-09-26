const mongoose = require("mongoose");

// Define supported languages
const SUPPORTED_LANGUAGES = ['English', 'Hindi', 'Hinglish'];

// Define difficulty levels
const DIFFICULTY_LEVELS = {
    EASY: 1,
    MEDIUM: 2,
    HARD: 3,
    EXPERT: 4,
    MASTER: 5
};

// Define riddle categories
const RIDDLE_CATEGORIES = [
    'Logic',
    'Math',
    'Wordplay',
    'Lateral Thinking',
    'Pattern Recognition',
    'General Knowledge',
    'Brain Teaser',
    'Puzzle'
];

// Define riddle status
const RIDDLE_STATUS = ['draft', 'published', 'archived'];

// Multilingual content schema
const multilingualContentSchema = {
    English: {
        type: String,
        required: true,
        trim: true,
        minlength: [3, 'Content must be at least 3 characters long'],
        maxlength: [1000, 'Content cannot exceed 1000 characters']
    },
    Hindi: {
        type: String,
        required: true,
        trim: true,
        maxlength: [1000, 'Content cannot exceed 1000 characters']
    },
    Hinglish: {
        type: String,
        required: true,
        trim: true,
        minlength: [3, 'Content must be at least 3 characters long'],
        maxlength: [1000, 'Content cannot exceed 1000 characters']
    }
};

const riddleSchema = new mongoose.Schema({
    questionId: {
        type: String,
        unique: true,
        required: [true, 'Question ID is required'],
        trim: true,
        uppercase: true,
        match: [/^R[0-9]{4,6}$/, 'Question ID must follow format: R followed by 4-6 digits']
    },

    // Difficulty level with validation
    level: {
        type: Number,
        required: [true, 'Difficulty level is required'],
        min: [1, 'Level must be between 1 and 5'],
        max: [5, 'Level must be between 1 and 5'],
        validate: {
            validator: function (v) {
                return Object.values(DIFFICULTY_LEVELS).includes(v);
            },
            message: 'Level must be one of: 1 (Easy), 2 (Medium), 3 (Hard), 4 (Expert), 5 (Master)'
        }
    },

    // Category for better organization
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true
    },

    // Tags for better searchability
    tags: [{
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [50, 'Tag cannot exceed 50 characters']
    }],

    // Multilingual question content
    question: {
        type: multilingualContentSchema,
        required: true,
        _id: false
    },

    // Multilingual answer content with case-insensitive matching
    answer: {
        type: multilingualContentSchema,
        required: true,
        _id: false
    },

    // Alternative acceptable answers
    alternativeAnswers: {
        English: [{
            type: String,
            trim: true,
            lowercase: true
        }],
        Hindi: [{
            type: String,
            trim: true
        }],
        Hinglish: [{
            type: String,
            trim: true,
            lowercase: true
        }]
    },

    // Multilingual hints
    hint: {
        type: multilingualContentSchema,
        required: true,
        _id: false
    },

    // Additional hints for progressive help
    additionalHints: {
        English: [{
            type: String,
            trim: true,
            maxlength: [500, 'Hint cannot exceed 500 characters']
        }],
        Hindi: [{
            type: String,
            trim: true,
            maxlength: [500, 'Hint cannot exceed 500 characters']
        }],
        Hinglish: [{
            type: String,
            trim: true,
            maxlength: [500, 'Hint cannot exceed 500 characters']
        }]
    },

    // Status management
    status: {
        type: String,
        enum: {
            values: RIDDLE_STATUS,
            message: 'Status must be one of: {VALUE}'
        },
        default: 'draft'
    },

    // Performance and analytics fields
    stats: {
        totalAttempts: {
            type: Number,
            default: 0,
            min: 0
        },
        correctSolves: {
            type: Number,
            default: 0,
            min: 0
        },
        averageTime: {
            type: Number, // in seconds
            default: 0,
            min: 0
        },
        hintsUsed: {
            type: Number,
            default: 0,
            min: 0
        }
    },

    // Content management
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Make optional if not using user management
    },

    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },

    publishedAt: {
        type: Date,
        default: null
    },

    // SEO and searchability
    slug: {
        type: String,
        unique: true,
        sparse: true, // Allows null values while maintaining uniqueness
        lowercase: true,
        trim: true
    }
}, {
    timestamps: true,
    // Add version key for optimistic concurrency control
    versionKey: '__v'
});

// Indexes for better performance
riddleSchema.index({ questionId: 1 }, { unique: true });
riddleSchema.index({ level: 1, category: 1 });
riddleSchema.index({ status: 1, publishedAt: -1 });
riddleSchema.index({ tags: 1 });
riddleSchema.index({ 'stats.totalAttempts': -1 });
riddleSchema.index({ createdAt: -1 });

// Compound index for efficient filtering
riddleSchema.index({
    status: 1,
    level: 1,
    category: 1
});

// Text index for search functionality
riddleSchema.index({
    'question.English': 'text',
    'question.Hindi': 'text',
    'question.Hinglish': 'text',
    'tags': 'text'
}, {
    weights: {
        'question.English': 10,
        'question.Hindi': 10,
        'question.Hinglish': 10,
        'tags': 5
    },
    name: 'riddle_search_index'
});

// Virtual for success rate
riddleSchema.virtual('successRate').get(function () {
    if (this.stats.totalAttempts === 0) return 0;
    return (this.stats.correctSolves / this.stats.totalAttempts * 100).toFixed(2);
});

// Virtual for difficulty text
riddleSchema.virtual('difficultyText').get(function () {
    const levels = {
        1: 'Easy',
        2: 'Medium',
        3: 'Hard',
        4: 'Expert',
        5: 'Master'
    };
    return levels[this.level] || 'Unknown';
});

// Pre-save middleware
riddleSchema.pre('save', function (next) {
    // Auto-generate questionId if not provided
    if (!this.questionId && this.isNew) {
        const timestamp = Date.now().toString().slice(-6);
        this.questionId = `RDL${timestamp}`;
    }

    // Set publishedAt when status changes to published
    if (this.status === 'published' && !this.publishedAt) {
        this.publishedAt = new Date();
    }

    // Generate slug from English question if not provided
    if (!this.slug && this.question && this.question.English) {
        const slugify = require('slugify');
        this.slug = slugify(this.questionId.toLowerCase());
    }

    next();
});



// Ensure virtual fields are included in JSON output
riddleSchema.set('toJSON', { virtuals: true });
riddleSchema.set('toObject', { virtuals: true });

const Riddle = mongoose.model("Riddle", riddleSchema);

module.exports = {
    Riddle,
    DIFFICULTY_LEVELS,
    RIDDLE_CATEGORIES,
    RIDDLE_STATUS,
    SUPPORTED_LANGUAGES
};
