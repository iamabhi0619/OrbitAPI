const { Schema, default: mongoose } = require("mongoose");

const postSchema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    slug: { type: String, unique: true, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'blog_TagCategories',
        required: true,
        
    },
    tags: [{
        type: Schema.Types.ObjectId,
        ref: 'blog_TagCategories',
        validate: { validator: v => v.type === 'tag', message: 'This must be a tag.' }
    }],
    media: [{ // Embed media directly in the post
        url: { type: String, required: true }, // URL of the media file (image, video, etc.)
        type: { type: String, enum: ['image', 'video'], required: true }, // Type of the media (image, video)
        caption: { type: String, default: '' }, // Optional caption for the media
        altText: { type: String, default: '' }, // Optional alt text for the media (for accessibility)
        createdAt: { type: Date, default: Date.now } // Timestamp for when the media was uploaded
    }],
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    publishedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('blog_Post', postSchema);