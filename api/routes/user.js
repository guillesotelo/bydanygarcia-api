const dotenv = require('dotenv')
const express = require('express')
const router = express.Router()
const { User } = require('../db/models')
const transporter = require('../helpers/mailer')
const { encrypt, decrypt } = require('../helpers')
const { REACT_APP_URL } = process.env
const jwt = require('jsonwebtoken')
dotenv.config()
const { JWT_SECRET } = process.env
const { verifyToken } = require('../helpers')

//User Login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body

        const user = await User.findOne({ email }).exec()
        if (!user) return res.status(401).json({ message: 'Email not found' })

        const compareRes = await user.comparePassword(password)
        if (!compareRes) return res.status(401).send('Invalid credentials')

        const token = jwt.sign({ sub: user._id }, JWT_SECRET, { expiresIn: '30d' })

        const {
            _id,
            updatedAt,
            createdAt,
            username
        } = user

        res.status(200).json({
            _id,
            updatedAt,
            createdAt,
            username,
            token
        })


    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Create new user / register
router.post('/create', async (req, res, next) => {
    try {
        const { email } = req.body

        const emailRegistered = await User.findOne({ email }).exec()
        if (emailRegistered) return res.status(401).send('Email already in use')

        const newUser = await User.create(req.body)
        if (!newUser) return res.status(400).send('Bad request')

        res.status(201).send(`User created successfully`)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Update User Data
router.post('/update', verifyToken, async (req, res, next) => {
    try {
        const { _id, newData } = req.body

        const newUser = await User.findByIdAndUpdate(_id, newData, { returnDocument: "after", useFindAndModify: false }).select('-password')
        if (!newUser) return res.status(404).send('Error updating User')

        const token = jwt.sign({ sub: newUser._id }, JWT_SECRET, { expiresIn: '30d' })

        res.status(200).json({ ...newUser._doc, token })
    } catch (err) {
        console.error('Something went wrong!', err)
        return res.send(500).send('Server Error')
    }
})

//Change user password
router.post('/changePass', async (req, res, next) => {
    try {
        const { userEmail, password } = req.body
        if (!userEmail) res.send(404).send('Wrong parameters')

        const email = decrypt(userEmail)

        const userData = await User.findOne({ email })
        if (!userData) return res.status(404).send('Email not found')

        const updatedUser = await User.findOneAndUpdate(
            { email }, { password }, { returnDocument: "after", useFindAndModify: false })
        if (!updatedUser) return res.status(404).send('Error updating User')

        await transporter.sendMail({
            from: `"Easy Notes" <${process.env.EMAIL}>`,
            to: email,
            subject: 'Your password has been changed',
            html: `<div style='margin-top: 3vw; text-align: center;'>
                        <h3 style='text-align: left; font-weight: normal; margin-bottom: 1vw;'>Hello, ${userData.username ? userData.username.split(' ')[0] : ''}!</h3>
                        <h3 style='font-weight: normal;'>Your password has been changed.</h3>
                        <h3 style='font-weight: normal;'>If it was a mistake, use <a style='text-decoration: none;' href='${REACT_APP_URL}/changePass?userEmail=${encrypt(userEmail)}'>this link</a> to generate a new one.</h3>
                        <h5 style='margin: 4px;'><a style='text-decoration: none;' href='${REACT_APP_URL}'>Easy Notes<a/></h5>
                    </div>`
        }).catch((err) => console.error('Something went wrong!', err))

        res.status(200).json({ messsage: 'Password updated successfully' })

    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Send Email to reset password
router.post('/resetByEmail', async (req, res, next) => {
    try {
        const { email } = req.body
        const user = await User.findOne({ email }).exec()
        if (!user) return res.status(404).json('Email not found')

        await transporter.sendMail({
            from: `"Easy Notes" <${process.env.EMAIL}>`,
            to: email,
            subject: 'Password Reset',
            html: `<div style='margin-top: 3vw; text-align: center;'>
                        <h3 style='text-align: left; font-weight: normal; margin-bottom: 1vw;'>Hello, ${user.username ? user.username.split(' ')[0] : ''}!</h3>
                        <h3 style='font-weight: normal;'>We received a request to update your password.<br/><br/>
                        Click <a style='text-decoration: none;' href='${REACT_APP_URL}/changePass?userEmail=${encrypt(email)}'>here</a> to reset your password.<br/><br/>
                        If it wasn't you, just ignore this email. You are the only one who has permission to change your password.</h3>
                        <h5 style='margin: 4px;'><a style='text-decoration: none;' href='${REACT_APP_URL}'>Easy Notes<a/></h5>
                    </div>`
        }).catch((err) => console.error('Something went wrong!', err))

        res.status(200).json({})
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Remove User
router.post('/remove', verifyToken, async (req, res, next) => {
    try {
        const { email } = req.body

        const user = await User.findOne({ email }).exec()
        if (!user) return res.status(401).send('User not found')

        const removed = await User.deleteOne({ email })
        if(!removed) return res.status(404).send('Error deleting user')

        res.status(200).send('User removed successfully')
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

module.exports = router