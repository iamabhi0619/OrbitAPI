const { Schema } = require("mongoose");

const bookmarkSchema = new Schema({
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('blog_Bookmark', bookmarkSchema);