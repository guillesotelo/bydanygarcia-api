const dotenv = require('dotenv')
const express = require('express')
const router = express.Router()
const { Subscription } = require('../db/models')
const { sendContactEmail } = require('../helpers/mailer')
const { encrypt, decrypt } = require('../helpers')
const { REACT_APP_URL } = process.env
const jwt = require('jsonwebtoken')
dotenv.config()
const { JWT_SECRET } = process.env
const { verifyToken } = require('../helpers')
const { chromium } = require('playwright');

//New subscription
router.post('/subscribe', async (req, res, next) => {
    try {
        const emailRegistered = await Subscription.findOne({ email }).exec()
        if (emailRegistered) return res.status(401).send('Email already subscripted')

        const newSubscription = await Subscription.create(req.body)
        if (!newSubscription) return res.status(400).send('Bad request')

        res.status(201).send(`Subscribed successfully`)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Send Contact Email
router.post('/sendContactEmail', async (req, res, next) => {
    try {
        await sendContactEmail('Dany', req.body, 'danielasangar92@gmail.com')

        res.status(201).send(`Subscribed successfully`)
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
        const browser = await chromium.launch({
            args: ['--disable-extensions', '--hide-scrollbars', '--disable-web-security'],
            ignoreHTTPSErrors: true,
        });
        const context = await browser.newContext();
        const page = await context.newPage();

        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Extract image URLs
        const imageUrls = await page.evaluate(() => {
            const images = document.querySelectorAll('img');
            return Array.from(images).map((img) => {
                const url = img.getAttribute('src');
                if (url.includes('pinimg') && img.width > 75) return url;
                else return '';
            });
        });

        await browser.close();

        res.json(imageUrls);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred.' });
    }
});

module.exports = router