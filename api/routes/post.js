const express = require('express')
const router = express.Router()
const { Post } = require('../db/models')

//Get all posts
router.get('/getAll', async (req, res, next) => {
    try {
        const posts = await Post.find({
            $or: [
                { removed: false },
                { removed: { $exists: false } }
            ]
        }).sort({ createdAt: -1 })
        if (!posts) return res.status(404).send('No posts found.')

        res.status(200).json(posts)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Get post by ID
router.get('/getById', async (req, res, next) => {
    try {
        const { _id } = req.query
        const post = await Post.findById(_id)
        if (!post) return res.status(404).send('Post not found.')

        res.status(200).json(post)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Create new post
router.post('/create', async (req, res, next) => {
    try {
        const postData = { ...req.body }
        if (postData._id) delete postData._id

        const newPost = await Post.create(postData)
        if (!newPost) return res.status(400).json('Error creating post')

        res.status(200).json(newPost)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Update post Data
router.post('/update', async (req, res, next) => {
    try {
        const { _id } = req.body
        let postData = { ...req.body }

        const updated = await Post.findByIdAndUpdate(_id, postData, { returnDocument: "after", useFindAndModify: false })
        if (!updated) return res.status(404).send('Error updating post.')

        res.status(200).json(updated)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Update post Data
router.post('/remove', async (req, res, next) => {
    try {
        const { _id } = req.body

        const deleted = await Post.findOneAndRemove({ _id })

        res.status(200).json(deleted)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})


module.exports = router