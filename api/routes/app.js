const dotenv = require('dotenv')
const express = require('express')
const router = express.Router()
const { Subscription, ScrappedImage } = require('../db/models')
const { sendContactEmail, sendCustomContactEmail, sendNotificationEmail } = require('../helpers/mailer')
dotenv.config()
const { verifyToken } = require('../helpers')
const { scrapePage } = require('../helpers/scraper')


//New subscription
router.post('/subscribe', async (req, res, next) => {
    try {
        const emailRegistered = await Subscription.findOne({ email: req.body.email }).exec()
        if (emailRegistered) return res.status(401).send('Email already subscripted')

        const newSubscription = await Subscription.create({ ...req.body, capturedFrom: 'Subscription' })
        if (!newSubscription) return res.status(400).send('Bad request')

        const emailData = {
            from: 'Dany García',
            to: 'danielasangar92@gmail.com',
            subject: 'New subscription!',
            html: `<h1>Your Mail Community just got bigger! A new member has joined:</h1>
                    <br/>
                    <h2>${req.body.email}</h2>
            `
        }

        await sendCustomContactEmail(emailData)

        res.status(201).send(`Subscribed successfully`)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Get all emails
router.get('/getAllEmails', verifyToken, async (req, res, next) => {
    try {
        const emails = await Subscription.find().sort({ createdAt: -1 })
        if (!emails) return res.status(200).send('No emails found.')

        res.status(200).json(emails)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Send Contact Email
router.post('/sendContactEmail', async (req, res, next) => {
    try {
        await sendContactEmail(req.body)

        res.status(201).send(`Message sent successfully`)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Send Custom Contact Email
router.post('/sendCustomContactEmail', async (req, res, next) => {
    try {
        await sendCustomContactEmail(req.body)

        res.status(201).send(`Custom message sent successfully`)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})


//Send Notification
router.post('/sendNotification', verifyToken, async (req, res, next) => {
    try {
        const sent = await sendNotificationEmail(req.body)
        if (!sent) res.status(400).send('Error sending mails')

        res.status(201).send(`Emails sent`)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Update Subscription
router.post('/updateSubscription', async (req, res, next) => {
    try {
        const { _id } = req.body
        let subscriptionData = { ...req.body }

        const updated = await Subscription.findByIdAndUpdate(_id, subscriptionData, { returnDocument: "after", useFindAndModify: false })
        if (!updated) return res.status(404).send('Error updating Subscription.')

        res.status(200).json(updated)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Cancel subscription
router.post('/cancelSubscription', async (req, res, next) => {
    try {
        const emailRegistered = await Subscription.findOne({ email }).exec()
        if (!emailRegistered) return res.status(401).send('Email not found')

        const canceled = await Subscription.findByIdAndUpdate(emailRegistered._id, { isActive: false }, { returnDocument: "after", useFindAndModify: false })
        if (!canceled) return res.status(400).send('Bad request')

        res.status(201).send(`Unsubscribed successfully`)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

// Scrape URL Page
router.post('/scrape-url', async (req, res) => {
    try {
        const { url, selector } = req.body;

        const imageUrls = await scrapePage(url, selector)
        res.json(imageUrls);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred.' });
    }
});

//Get scrapped images
router.get('/getScrappedImages', async (req, res, next) => {
    try {
        const { gallery } = req.query
        const scrapped = gallery ? await ScrappedImage.findOne({ gallery }) : await ScrappedImage.find()
        if (!scrapped) return res.status(200).send('No images found.')
            
        const images = JSON.parse(scrapped.urls || '[]')

        res.status(200).json(images)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

module.exports = router