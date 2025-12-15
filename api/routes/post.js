const express = require('express')
const router = express.Router()
const { Post } = require('../db/models')
const { verifyToken, createPreviewImage, compressHtml, decompressHtml, saveCompressedImagesFromHtml, imageIsCompressed } = require('../helpers')
const multer = require('multer')
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB safety limit
    }
})

//Get all posts
router.get('/getAll', async (req, res, next) => {
    try {
        const { isAdmin } = req.query
        const filter = '-imageUrl -image -sideImgs -html -spaHtml -zHtml -zSpaHtml -rawData -spaRawData -pdf'

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
        const posts = await Post.find().select('-html -spaHtml -zHtml -zSpaHtml -sideImgs -rawData -spaRawData -pdf')

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

// compress all HTML images (run once)
router.get('/compressHtml', async (req, res, next) => {
    try {
        const { slug } = req.query
        const posts = slug ? await Post.find({ slug }).select('_id') : await Post.find().select('_id')
        const length = posts.length
        let count = 0
        console.log(`Starting compression for ${length} posts...`)

        for (const post of posts) {
            const current = await Post.findById(post._id).select('title spaTitle html spaHtml zHtml')

            // if (current.zHtml) {
            //     console.log(`HTML already compressed for: ${current.title || current.spaTitle}`)
            //     count++
            //     continue
            // }

            const size = Buffer.byteLength(current.html || '', 'utf8') + Buffer.byteLength(current.spaHtml || '', 'utf8')

            console.log('\n')
            console.log(`Compressing: "${current.title || current.spaTitle}" [${size} chars]...`)
            const zHtml = await compressHtml(current.html || '')
            const zSpaHtml = await compressHtml(current.spaHtml || '')
            let newSize = 0

            if (zHtml || zSpaHtml) {
                newSize = (zHtml || '').length + (zSpaHtml || '').length
                const reduction = (newSize * 100) / (size || 1)

                await Post.findByIdAndUpdate(
                    post._id,
                    { zHtml, zSpaHtml },
                    { returnDocument: "after", useFindAndModify: false }
                )
                console.log(`Compressed HTML for: "${current.title || current.spaTitle}" [-${reduction.toFixed(1)}%]`)
            }
            count++
        }

        res.status(200).json(`Done compressing ${count} posts`)
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

        const postData = {
            ...post._doc,
            html: await decompressHtml(post.zHtml),
            spaHtml: await decompressHtml(post.zSpaHtml),
            zHtml: null,
            zSpaHtml: null
        }

        if (!post) return res.status(404).send('Post not found.')

        res.status(200).json(postData)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Get post metadata
router.get('/getMetadataBySlug', async (req, res, next) => {
    try {
        const { slug } = req.query
        const post = await Post.findOne({ slug })
            .select('-imageUrl -image -sideImgs -html -spaHtml -zHtml -zSpaHtml -rawData -spaRawData -pdf').exec();

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
        const post = await Post.findOne({ slug })
            .select('-previewImage -html -spaHtml -image -imageUrl -rawData -spaRawData').exec()

        if (post._id && post.pdf && post.type === 'PDF') {
            res.setHeader('Content-Type', 'application/pdf')
            res.setHeader('Content-Disposition', 'inline')
            return res.send(post.pdf) // Buffer → stream
        }
        
        const postData = {
            ...post._doc,
            html: await decompressHtml(post.zHtml),
            spaHtml: await decompressHtml(post.zSpaHtml),
            zHtml: null,
            zSpaHtml: null
        }

        if (!post) return res.status(404).send('Post not found.')

        res.status(200).json(postData)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Create new post
router.post('/create', verifyToken, upload.single('pdf'), async (req, res, next) => {
    try {
        const { slug, html, spaHtml } = req.body
        const previewImage = await createPreviewImage(req.body)

        const slugExists = await Post.findOne({ slug })
        const newSlug = slugExists ? slug + '-copy' : slug

        const newPost = await Post.create({
            ...req.body,
            previewImage,
            slug: newSlug,
            zHtml: await compressHtml(html),
            zSpaHtml: await compressHtml(spaHtml),
            compressedImages: saveCompressedImagesFromHtml(html, spaHtml),
            pdf: req.file ? req.file.buffer : undefined
        })

        if (!newPost) return res.status(400).json('Error creating post')

        res.status(200).json({ _id: newPost._id })
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Update post Data
router.post('/update', verifyToken, upload.single('pdf'), async (req, res, next) => {
    try {
        const { _id, slug, html, spaHtml, compressedImages, imageUrl, image } = req.body
        const previewImage = imageIsCompressed(imageUrl || image, compressedImages) ?
            imageUrl || image
            : await createPreviewImage(req.body)

        const slugExists = await Post.findOne({ slug })
        const newSlug = slugExists && slugExists._id === _id ? slug + '-copy' : slug

        let postData = {
            ...req.body,
            previewImage,
            slug: newSlug,
            zHtml: await compressHtml(html),
            zSpaHtml: await compressHtml(spaHtml),
            compressedImages: saveCompressedImagesFromHtml(html, spaHtml)
        }

        if (req.file) postData.pdf = req.file.buffer

        const updated = await Post.findByIdAndUpdate(_id, postData, { returnDocument: "after", useFindAndModify: false })
        if (!updated) return res.status(404).send('Error updating post.')

        res.status(200).json({ _id: updated._id })
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