const mongoose = require('mongoose');

const NewsletterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  recipients: [String],
  status: { type: String, enum: ['draft', 'sent'], default: 'draft' },
  sentAt: Date,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Newsletter', NewsletterSchema);
