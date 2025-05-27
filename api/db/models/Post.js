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
    slug: {
        type: String
    },
    overlap: {
        type: String
    },
    category: {
        type: String
    },
    tags: {
        type: String
    },
    video: {
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
    previewImage: {
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
    html: {
        type: String
    },
    spaHtml: {
        type: String
    },
    zHtml: {
        type: Buffer
    },
    zSpaHtml: {
        type: Buffer
    },
    published: {
        type: Boolean,
        default: false
    },
    removed: {
        type: Boolean,
        default: false
    },
}, { timestamps: true })

const Post = mongoose.model('Post', postSchema)

module.exports = Post