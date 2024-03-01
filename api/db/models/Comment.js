const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
    fullname: {
        type: String
    },
    email: {
        type: String
    },
    comment: {
        type: String
    },
    postId: {
        type: String
    },
    replyingTo: {
        type: String
    },
    isDany: {
        type: Boolean
    },
    likes: {
        type: Number,
        default: 0
    },
}, { timestamps: true })

const Comment = mongoose.model('Comment', commentSchema)

module.exports = Comment