const mongoose = require('mongoose')

const scrappedImageSchema = new mongoose.Schema({
    urls: {
        type: String
    },
    gallery: {
        type: String
    },
}, { timestamps: true })

const ScrappedImage = mongoose.model('ScrappedImage', scrappedImageSchema)

module.exports = ScrappedImage