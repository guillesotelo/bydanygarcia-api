const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    title: {
        type: String
    },
    description: {
        type: String
    },
    price: {
        type: Number
    },
    image: {
        type: String
    },
    previewImage: {
        type: String
    },
    active: {
        type: Boolean,
        default: true
    },
    stock: {
        type: Number,
        default: 1
    },
    currency: {
        type: String
    },
    images: {
        type: String
    },
    compressed: {
        type: String
    },
    compressedImages: {
        type: String
    },
    category: {
        type: String
    },
    order: {
        type: Number
    }
}, { timestamps: true })

const Product = mongoose.model('Product', productSchema)

module.exports = Product