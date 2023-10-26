const dotenv = require('dotenv')
dotenv.config()
const chromium = require("@sparticuz/chromium")
const fromServer = process.env.AWS_LAMBDA_FUNCTION_VERSION
puppeteer = fromServer ? require('puppeteer-core') : require('puppeteer')

const scrapePage = async (url, selector) => {
    let browser = null
    if (fromServer) {
        chromium.setHeadlessMode = true
        chromium.setGraphicsMode = false

        browser = await puppeteer.launch({
            ignoreDefaultArgs: ['--disable-extensions'],
            args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: 'always',
            ignoreHTTPSErrors: true
        })
    } else {
        browser = await puppeteer.launch({
            ignoreDefaultArgs: ['--disable-extensions'],
            args: ['--hide-scrollbars', '--disable-web-security'],
            headless: 'always',
            ignoreHTTPSErrors: true
        })
    }

    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    let imageUrls = []
    let previousHeight

    while (true) {
        const currentHeight = await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight)
            return document.body.scrollHeight
        })
        await page.waitForTimeout(200)

        if (currentHeight === previousHeight) break
        previousHeight = currentHeight

        const newImageUrls = await page.evaluate(() => {
            const images = document.querySelector("div[role='list']").querySelectorAll('img')
            return Array.from(images).map((img) => {
                const url = img.getAttribute('src')
                if (url.includes('pinimg') && img.width > 75) return url
                else return ''
            })
        })

        imageUrls = [...imageUrls, ...newImageUrls]
    }
    await browser.close()

    return [...new Set(imageUrls)]
}

module.exports = { scrapePage }