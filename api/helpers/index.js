const dotenv = require('dotenv')
dotenv.config()
const crypto = require('crypto');
const ALG = "aes-256-cbc"
const jwt = require('jsonwebtoken')
const { JWT_SECRET, KEY, IV } = process.env
const sharp = require('sharp')
const { JSDOM } = require('jsdom');
const zlib = require('zlib');

const encrypt = text => {
    let cipher = crypto.createCipheriv(ALG, KEY, IV);
    let encrypted = cipher.update(text.toString(), 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
}

const decrypt = text => {
    let decipher = crypto.createDecipheriv(ALG, KEY, IV);
    let decrypted = decipher.update(text, 'base64', 'utf8');
    return (decrypted + decipher.final('utf8'));
}

const verifyToken = (req, res, next) => {
    const bearerHeader = req.headers['authorization']
    if (bearerHeader) {
        const bearerToken = bearerHeader.split(' ')[1]
        jwt.verify(bearerToken, JWT_SECRET, (error, _) => {
            if (error) return res.sendStatus(403)
            next()
        })
    } else res.sendStatus(403)
}

const delay = (time) => {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    })
}

const createPreviewImage = async (data) => {
    try {
        const image = data ? data.images ? JSON.parse(data.images || '[]')[0] : data.imageUrl || data.image : null
        if (!image) return ''
        if (image.length < 3000) return image

        const matches = image.match(/^data:(image\/\w+);base64,(.+)$/)
        if (!matches || matches.length !== 3) {
            console.error('Invalid base64 image string')
            return ''
        }

        const mimeType = matches[1]
        const base64Data = matches[2]
        const buffer = Buffer.from(base64Data, 'base64')

        const resizedBuffer = await sharp(buffer)
            .resize({ width: 600, height: 600, fit: 'inside' }) // keep aspect ratio
            .jpeg({ quality: 85 }) // or use .png()/.webp() if needed
            .toBuffer()

        return `data:${mimeType};base64,${resizedBuffer.toString('base64')}`

    } catch (error) {
        console.error(error)
        return ''
    }
}

const compressImage = async (image, { w, h, q }) => {
    try {
        if (!image) return ''
        if (image.length < 3000) return image

        const matches = image.match(/^data:(image\/\w+);base64,(.+)$/)
        if (!matches || matches.length !== 3) {
            console.error('Invalid base64 image string')
            return ''
        }

        const mimeType = matches[1]
        const base64Data = matches[2]
        const buffer = Buffer.from(base64Data, 'base64')

        const resizedBuffer = await sharp(buffer)
            .resize({ width: w || 700, height: h || 700, fit: 'inside' })
            .jpeg({ quality: q || 85 })
            .toBuffer()

        return `data:${mimeType};base64,${resizedBuffer.toString('base64')}`
    } catch (error) {
        console.error(error)
        return ''
    }
}

const compressHtml = async (html) => {
    try {

        const gzipHTML = async (html) => {
            return new Promise((resolve, reject) => {
                zlib.gzip(html, (err, buffer) => {
                    if (err) return reject(err)
                    resolve(buffer) // This is a binary Buffer
                })
            })
        }

        const dom = new JSDOM(html)
        const document = dom.window.document
        const images = document.querySelectorAll('img')

        const tasks = Array.from(images).map(async (img) => {
            const src = img.getAttribute('src')
            const alreadyCompressed = img.hasAttribute('data-compressed')
            if (src && src.startsWith('data:image/' && !alreadyCompressed)) {
                try {
                    const compressedSrc = await compressImage(src)
                    img.setAttribute('src', compressedSrc)
                    img.setAttribute('data-compressed', 'true')
                } catch (err) {
                    console.error('Error compressing image:', err)
                }
            }
        })

        await Promise.all(tasks)

        const compressedHtml = await gzipHTML(dom.serialize())

        return compressedHtml
    } catch (error) {
        console.error(error)
        return ''
    }
}

const decompressHtml = async (zHtml) => {
    try {
        if (!zHtml) return null

        // Decode from base64 if needed
        let buffer
        if (typeof zHtml === 'string') {
            buffer = Buffer.from(zHtml, 'base64');
        } else if (zHtml._bsontype === 'Binary') {
            // MongoDB Binary object — extract underlying base64
            buffer = Buffer.from(zHtml.base64(), 'base64')
        } else if (Buffer.isBuffer(zHtml)) {
            buffer = zHtml
        } else {
            return null
        }
        if (buffer.length === 0) return null

        return new Promise((resolve, reject) => {
            zlib.gunzip(buffer, (err, result) => {
                if (err) return reject(err)
                resolve(result.toString('utf8'))
            })
        })
    } catch (error) {
        console.error(error)
        return null
    }
}

const saveCompressedImagesFromHtml = (html, spaHtml) => {
    let compressed = []
    try {
        if (html) {
            const dom = new JSDOM(html)
            const document = dom.window.document
            const images = document.querySelectorAll('img')

            images.forEach(image => {
                compressed.push(image.slice(0, 50) + image.slice(1500, 1550) + image.slice(3000, 3050))
            })
        }

        if (spaHtml) {
            const dom = new JSDOM(spaHtml)
            const document = dom.window.document
            const images = document.querySelectorAll('img')

            images.forEach(image => {
                compressed.push(image.slice(0, 50) + image.slice(1500, 1550) + image.slice(3000, 3050))
            })
        }

        return JSON.stringify(compressed)
    } catch (error) {
        return ''
    }
}

const saveCompressedImages = (images) => {
    if (!images || !images.length) return ''
    try {
        let compressed = []
        images.forEach(image => {
            compressed.push(image.slice(0, 50) + image.slice(1500, 1550) + image.slice(3000, 3050))
        })
        return JSON.stringify(compressed)
    } catch (error) {
        return ''
    }
}

const imageIsCompressed = (image, compressed) => {
    if (!image || !compressed) return ''
    try {
        return JSON.parse(compressed).includes(image.slice(0, 50) + image.slice(1500, 1550) + image.slice(3000, 3050))
    } catch (error) {
        return ''
    }
}

module.exports = {
    encrypt,
    decrypt,
    verifyToken,
    delay,
    createPreviewImage,
    compressImage,
    compressHtml,
    decompressHtml,
    saveCompressedImages,
    saveCompressedImagesFromHtml,
    imageIsCompressed
}