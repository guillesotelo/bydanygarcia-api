const express = require('express')
const router = express.Router()
const { Product } = require('../db/models')
const { verifyToken, createPreviewImage, compressImage } = require('../helpers')

//Get all products
router.get('/getAll', async (req, res, next) => {
    try {
        const products = await Product.find().select('-images -image').sort({ createdAt: -1 })
        if (!products) return res.status(200).send('No products found.')

        res.status(200).json(products)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Get product by ID
router.get('/getById', async (req, res, next) => {
    try {
        const { _id } = req.query
        const product = await Product.findById(_id).select('-previewImage')
        if (!product) return res.status(404).send('product not found.')

        res.status(200).json(product)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Get post metadata
router.get('/getMetadataById', async (req, res, next) => {
    try {
        const { _id } = req.query
        const product = await Product.findOne({ _id })
            .select('-images -image').exec()

        if (!product) return res.status(404).send('Product not found.')

        res.status(200).json(product)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

// compress images (run once)
router.get('/compressImages', async (req, res, next) => {
    try {
        const products = await Product.find().select('_id')

        for (const product of products) {
            const current = await Product.findById(product._id)

            console.log(`\n`)
            console.log(`Compressing images for: ${current.title}...`)

            const compressedImages = await Promise.all(JSON.parse(current.images || [])
                .map(async image => await compressImage(image)))

            if (compressedImages && compressedImages.length) {
                await Product.findByIdAndUpdate(
                    product._id,
                    { images: JSON.stringify(compressedImages) },
                    { returnDocument: "after", useFindAndModify: false }
                )
                console.log(`Done`)
            }
        }

        res.status(200).json('Compression done.')
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})


// create image preview for all (run once)
router.get('/createPreviewForAll', async (req, res, next) => {
    try {
        const products = await Product.find()

        for (const product of products) {
            if (product.previewImage) continue

            const previewImage = await createPreviewImage(product)

            if (previewImage) {
                await Product.findByIdAndUpdate(
                    product._id,
                    { previewImage },
                    { returnDocument: "after", useFindAndModify: false }
                )
                console.log(`Updated product "${product.title}"`)
            }
        }

        res.status(200).json('Previews created successfully :)')
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Create new product
router.post('/create', verifyToken, async (req, res, next) => {
    try {
        const previewImage = createPreviewImage(req.body)

        const compressedImages = await Promise.all(JSON.parse(req.body.images || '[]')
            .map(async image => await compressImage(image)))

        const newProduct = await Product.create({
            ...req.body,
            previewImage,
            images: JSON.stringify(compressedImages)
        })
        if (!newProduct) return res.status(400).json('Error creating product')

        res.status(200).json(newProduct)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Update product Data
router.post('/update', verifyToken, async (req, res, next) => {
    try {
        const { _id, images } = req.body
        const previewImage = createPreviewImage(req.body)

        const compressedImages = await Promise.all(JSON.parse(images || '[]')
            .map(async image => await compressImage(image)))

        let productData = {
            ...req.body,
            previewImage,
            images: JSON.stringify(compressedImages)
        }

        const updated = await Product.findByIdAndUpdate(_id, productData, { returnDocument: "after", useFindAndModify: false })
        if (!updated) return res.status(404).send('Error updating post.')

        res.status(200).json(updated)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})

//Update product order
router.post('/updateOrder', verifyToken, async (req, res, next) => {
    try {
        const { products } = req.body
        let updatedProducts = []
        if (products && products.length) {
            updatedProducts = await Promise.all(products.map(async (product) =>
                Product.findByIdAndUpdate(product._id, product, { returnDocument: "after", useFindAndModify: false })
            ))
            updatedProducts.forEach((product, index) => {
                if (!product) console.error(`Unable to update product order: ${JSON.stringify(products[index])}`)
            })
        }

        res.status(200).json(updatedProducts)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Update post Data
router.post('/remove', verifyToken, async (req, res, next) => {
    try {
        const { _id } = req.body

        const deleted = await Product.findOneAndRemove({ _id })

        res.status(200).json(deleted)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.send(500).send('Server Error')
    }
})


module.exports = router