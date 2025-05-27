const dotenv = require('dotenv')
dotenv.config()
const crypto = require('crypto');
const ALG = "aes-256-cbc"
const jwt = require('jsonwebtoken')
const { JWT_SECRET, KEY, IV } = process.env
const sharp = require('sharp')
const { JSDOM } = require('jsdom');

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
            .resize({ width: 400, height: 600, fit: 'inside' }) // keep aspect ratio
            .jpeg({ quality: 70 }) // or use .png()/.webp() if needed
            .toBuffer()

        return `data:${mimeType};base64,${resizedBuffer.toString('base64')}`

    } catch (error) {
        console.error(error)
        return ''
    }
}


const compressHtmlImages = async (html) => {
    try {
        const compressImage = async (image) => {
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
                    .resize({ width: 600, height: 600, fit: 'inside' })
                    .png({ quality: 70 })
                    .toBuffer()

                return `data:${mimeType};base64,${resizedBuffer.toString('base64')}`
            } catch (error) {
                console.error(error)
                return ''
            }
        }

        if (!html || html.length < 5000) return html

        const dom = new JSDOM(html)
        const document = dom.window.document
        const images = document.querySelectorAll('img')

        const tasks = Array.from(images).map(async (img) => {
            const src = img.getAttribute('src')
            if (src && src.startsWith('data:image/')) {
                try {
                    const compressedSrc = await compressImage(src)
                    img.setAttribute('src', compressedSrc)
                } catch (err) {
                    console.error('Error compressing image:', err)
                }
            }
        })

        await Promise.all(tasks)
        return dom.serialize()
    } catch (error) {
        console.error(error)
    }
}

module.exports = {
    encrypt,
    decrypt,
    verifyToken,
    delay,
    createPreviewImage,
    compressHtmlImages
}