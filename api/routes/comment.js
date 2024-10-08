const express = require('express')
const router = express.Router()
const { Comment, Subscription, Post } = require('../db/models')
const { verifyToken } = require('../helpers')
const { newPostComment } = require('../helpers/emailTemplates')
const { sendCommentEmail } = require('../helpers/mailer')

//Get all comments
router.get('/getAll', async (req, res, next) => {
    try {
        const comments = await Comment.find().sort({ createdAt: -1 })
        if (!comments) return res.status(200).send('No comments found.')

        res.status(200).json(comments)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Get all comments by postId
router.get('/getByPostId', async (req, res, next) => {
    try {
        const { postId } = req.query
        if (!postId) return res.status(200).json([])

        const comments = await Comment.find({ postId }).sort({ createdAt: -1 })
        if (!comments) return res.status(200).send('No comments found.')

        res.status(200).json(comments)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Get all replies by id
router.get('/getRepliesById', async (req, res, next) => {
    try {
        const { replyingTo } = req.query
        const comments = await Comment.find({ replyingTo }).sort({ createdAt: -1 })
        if (!comments) return res.status(200).send('No comments found.')

        res.status(200).json(comments)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Get post by ID
router.get('/getById', async (req, res, next) => {
    try {
        const { _id } = req.query
        const comment = await Comment.findById(_id)
        if (!comment) return res.status(404).send('Comment not found.')

        res.status(200).json(comment)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Create new post
router.post('/create', async (req, res, next) => {
    try {
        const { email } = req.body
        const newComment = await Comment.create(req.body)
        const post = Post.find({ _id: newComment.postId })
        if (post) await sendCommentEmail({ ...req.body, postName: post.title })

        if (email) {
            const subscriptions = await Subscription.find()
            if (subscriptions && subscriptions.length) {
                let subscribed = false
                subscriptions.forEach(doc => {
                    if (doc.email === email) subscribed = true
                })
                if (!subscribed) await Subscription.create({ ...req.body, capturedFrom: 'Comment' })
            }
        }

        if (!newComment) return res.status(400).json('Error creating comment')

        res.status(200).json(newComment)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Update post Data
router.post('/update', async (req, res, next) => {
    try {
        const { _id } = req.body
        let commentData = { ...req.body }

        const updated = await Comment.findByIdAndUpdate(_id, commentData, { returnDocument: "after", useFindAndModify: false })
        if (!updated) return res.status(404).send('Error updating post.')

        res.status(200).json(updated)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Update post Data
router.post('/remove', verifyToken, async (req, res, next) => {
    try {
        const { _id } = req.body

        const deleted = await Comment.findOneAndRemove({ _id })

        res.status(200).json(deleted)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})


module.exports = router