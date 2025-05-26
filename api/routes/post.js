const express = require('express')
const router = express.Router()
const { Post } = require('../db/models')
const { verifyToken, createPreviewImage } = require('../helpers')

//Get all posts
router.get('/getAll', async (req, res, next) => {
    try {
        const { isAdmin } = req.query
        const filter = '-imageUrl -image -sideImgs -html -spaHtml -rawData -spaRawData'

        const posts = await Post.find({
            $or: [
                { removed: false },
                { removed: { $exists: false } }
            ]
        })
            .select(filter)
            .sort({ createdAt: -1 })

        if (!posts) return res.status(404).send('No posts found.')

        const filteredPosts = isAdmin ? posts : posts.filter(post => post.published)

        // Promise.all(posts.map(post => {
        //     post.slug = (post.title.trim() || post.spaTitle.trim())
        //         .normalize('NFD')
        //         .replace(/[\u0300-\u036f]/g, '')
        //         .replace(/[^a-zA-Z0-9\s-]/g, '')
        //         .replace(/\s+/g, '-')
        //         .replace(/-+/g, '-')
        //     post.save()
        // }))

        res.status(200).json(filteredPosts)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

// create image preview for all (run once)
router.get('/createPreviewForAll', async (req, res, next) => {
    try {
        const posts = await Post.find().select('-html -spaHtml -sideImgs -rawData -spaRawData')

        for (const post of posts) {
            const imageUrl = post.imageUrl || post.image
            if (!imageUrl || post.previewImage) continue

            const previewImage = await createPreviewImage(post)

            if (previewImage) {
                await Post.findByIdAndUpdate(
                    post._id,
                    { previewImage },
                    { returnDocument: "after", useFindAndModify: false }
                )
                console.log(`Updated post "${post.title}"`)
            }
        }

        res.status(200).json('Previews created successfully :)')
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

//Get post ID by Slug
router.get('/getIdBySlug', async (req, res, next) => {
    try {
        const { slug } = req.query
        const post = await Post.findOne({ slug }).select('_id').exec();

        if (!post) return res.status(404).send('Post not found.')

        res.status(200).json(post)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Get post by Title
router.get('/getBySlug', async (req, res, next) => {
    try {
        const { slug } = req.query
        let post = await Post.findOne({ slug }).exec()

        if (!post) return res.status(404).send('Post not found.')

        res.status(200).json(post)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Get post content by Slug
router.get('/getContentBySlug', async (req, res, next) => {
    try {
        const { slug } = req.query
        let post = await Post.findOne({ slug }).select('-previewImage -image -imageUrl -rawData -spaRawData').exec()

        if (!post) return res.status(404).send('Post not found.')

        res.status(200).json(post)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Create new post
router.post('/create', verifyToken, async (req, res, next) => {
    try {
        const previewImage = createPreviewImage(req.body)

        const newPost = await Post.create({ ...req.body, previewImage })
        if (!newPost) return res.status(400).json('Error creating post')

        res.status(200).json(newPost)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Update post Data
router.post('/update', verifyToken, async (req, res, next) => {
    try {
        const { _id } = req.body
        const previewImage = createPreviewImage(req.body)
        let postData = { ...req.body, previewImage }

        const updated = await Post.findByIdAndUpdate(_id, postData, { returnDocument: "after", useFindAndModify: false })
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

        const updated = await Post.findByIdAndUpdate(_id, { removed: true }, { returnDocument: "after", useFindAndModify: false })
        if (!updated) return res.status(404).send('Error updating post.')

        res.status(200).json(true)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})


module.exports = router