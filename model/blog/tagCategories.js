
const { Schema, default: mongoose } = require("mongoose");

const tagCategories = new Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    slug: { type: String, unique: true, required: true },
    type: {
        type: String,
        enum: ['category', 'tag'],
        required: true
    },
    parent: {
        type: Schema.Types.ObjectId,
        ref: 'Combined',
        default: null
    },
    usageCount: {
        type: Number,
        default: 0
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('blog_TagCategories', tagCategories);
