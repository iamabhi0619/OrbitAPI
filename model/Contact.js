const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    message: { type: String, required: true, trim: true },
    feedback: { type: String, default: "", trim: true },
    reply: { type: String, default: "", trim: true },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'closed'],
        default: 'open'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    category: {
        type: String,
        enum: ['general', 'project-inquiry', 'collaboration', 'feedback', 'other'],
        default: 'general'
    },
    source: {
        type: String,
        enum: ['website', 'email', 'other'],
        default: 'website'
    },
    readAt: { type: Date },
    repliedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Contact', ContactSchema);
