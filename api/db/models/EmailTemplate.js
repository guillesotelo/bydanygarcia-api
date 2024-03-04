const mongoose = require('mongoose')

const emailTemplateSchema = new mongoose.Schema({
    name: {
        type: String
    },
    type: {
        type: String
    },
    html: {
        type: String
    },
}, { timestamps: true })

const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema)

module.exports = EmailTemplate