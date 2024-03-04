const express = require('express')
const router = express.Router()
const { EmailTemplate } = require('../db/models')
const { verifyToken } = require('../helpers')

//Get all templates
router.get('/getAll', verifyToken, async (req, res, next) => {
    try {
        const emailTemplates = await EmailTemplate.find().sort({ createdAt: -1 })
        if (!emailTemplates) return res.status(200).send('No templates found.')

        res.status(200).json(emailTemplates)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Get template by ID
router.get('/getById', verifyToken, async (req, res, next) => {
    try {
        const { _id } = req.query
        const emailTemplate = await EmailTemplate.findById(_id)
        if (!post) return res.status(404).send('Template not found.')

        res.status(200).json(emailTemplate)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Create new template
router.post('/create', verifyToken, async (req, res, next) => {
    try {
        const emailTemplate = await EmailTemplate.create(req.body)
        if (!emailTemplate) return res.status(400).json('Error creating template')

        res.status(200).json(emailTemplate)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Update template Data
router.post('/update', verifyToken, async (req, res, next) => {
    try {
        const { _id } = req.body
        let emailTemplateData = { ...req.body }

        const updated = await EmailTemplate.findByIdAndUpdate(_id, emailTemplateData, { returnDocument: "after", useFindAndModify: false })
        if (!updated) return res.status(404).send('Error updating template.')

        res.status(200).json(updated)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Update template Data
router.post('/remove', verifyToken, async (req, res, next) => {
    try {
        const { _id } = req.body

        const deleted = await EmailTemplate.findOneAndRemove({ _id })

        res.status(200).json(deleted)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})


module.exports = router