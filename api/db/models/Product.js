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
    image: {
        type: String
    },
}, { timestamps: true })

const Product = mongoose.model('Product', productSchema)

module.exports = Product