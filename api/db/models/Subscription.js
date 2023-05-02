const mongoose = require('mongoose')

const subscriptionSchema = new mongoose.Schema({
    email: {
        type: String
    },
    fullname: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    data: {
        type: String
    },
}, { timestamps: true })

const Subscription = mongoose.model('Subscription', subscriptionSchema)

module.exports = Subscription