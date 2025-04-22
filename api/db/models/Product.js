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
    inStock: {
        type: Boolean,
        default: true
    },
}, { timestamps: true })

const Product = mongoose.model('Product', productSchema)

module.exports = Product