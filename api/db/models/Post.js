const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
    title: {
        type: String
    },
    subtitle: {
        type: String
    },
    description: {
        type: String
    },
    overlap: {
        type: String
    },
    tags: {
        type: String
    },
    rawData: {
        type: String
    },
    image: {
        type: String
    },
    sideImgs: {
        type: String
    },
    imageUrl: {
        type: String
    },
    type: {
        type: String
    },
}, { timestamps: true })

const Post = mongoose.model('Post', postSchema)

module.exports = Post