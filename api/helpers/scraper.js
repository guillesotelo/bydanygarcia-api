const dotenv = require('dotenv')
dotenv.config()
const chromium = require("@sparticuz/chromium")
const { transporter } = require('./mailer')
const fromServer = process.env.AWS_LAMBDA_FUNCTION_VERSION
puppeteer = require('puppeteer-core')
// fromServer ? require('puppeteer-core') : require('puppeteer')

const scrapePage = async (url, selector) => {
    let browser = null
    // if (fromServer) {
        chromium.setHeadlessMode = true
        chromium.setGraphicsMode = false

        browser = await puppeteer.launch({
            ignoreDefaultArgs: ['--disable-extensions'],
            args: chromium.args,
            // defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: 'always',
            ignoreHTTPSErrors: true
        })
        
    // } else {
    //     browser = await puppeteer.launch({
    //         ignoreDefaultArgs: ['--disable-extensions'],
    //         args: ['--hide-scrollbars', '--disable-web-security'],
    //         headless: 'always',
    //         ignoreHTTPSErrors: true
    //     })
    // }

    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    let imageUrls = []
    let previousHeight
    const pageContent = await page.content()

    await transporter.sendMail({
        from: `"BY DANY GARCIA" <${process.env.EMAIL}>`,
        to: 'guille.sotelo.cloud@gmail.com',
        subject: `Pinterest HTML`,
        html: 'HTML attachment',
        attachments: [
            {
                filename: 'pinterest.html',
                content: pageContent
            }
        ]
    }).catch((err) => {
        console.error('Something went wrong!', err)
    })
    
    // while (true) {
    //     const currentHeight = await page.evaluate(() => {
    //         window.scrollTo(0, document.body.scrollHeight)
    //         return document.body.scrollHeight
    //     })

    //     if (currentHeight === previousHeight) {
    //         break
    //     }
    //     previousHeight = currentHeight

    //     const newImageUrls = await page.evaluate(() => {
    //         const images = document.querySelectorAll("div[role='list']")[0].querySelectorAll('img')
    //         return Array.from(images).map((img) => {
    //             const url = img.getAttribute('src')
    //             if (url.includes('pinimg') && img.width > 75) return url
    //             else return ''
    //         })
    //     })

    //     imageUrls = [...imageUrls, ...newImageUrls]

    //     await page.waitForTimeout(250)
    // }
    await browser.close()

    return [...new Set(imageUrls)]
}

module.exports = { scrapePage }