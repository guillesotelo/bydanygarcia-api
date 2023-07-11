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
    sideStyles: {
        type: String
    },
    imageUrl: {
        type: String
    },
    type: {
        type: String
    },
    spaTitle: {
        type: String
    },
    spaSubtitle: {
        type: String
    },
    spaDescription: {
        type: String
    },
    spaOverlap: {
        type: String
    },
    spaRawData: {
        type: String
    },
}, { timestamps: true })

const Post = mongoose.model('Post', postSchema)

module.exports = Post