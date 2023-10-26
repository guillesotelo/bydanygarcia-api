const dotenv = require('dotenv')
dotenv.config()
const chromium = require("@sparticuz/chromium")
const fromServer = process.env.AWS_LAMBDA_FUNCTION_VERSION
puppeteer = fromServer ? require('puppeteer-core') : require('puppeteer')
const fs = require('fs');

const scrapePage = async (url, selector) => {
    let browser = null
    if (fromServer) {
        chromium.setHeadlessMode = true
        chromium.setGraphicsMode = false

        browser = await puppeteer.launch({
            ignoreDefaultArgs: ['--disable-extensions'],
            args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
            // defaultViewport: chromium.defaultViewport,
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

    // Scroll down repeatedly until all images are loaded
    let imageUrls = []
    let previousHeight
    while (true) {
        const currentHeight = await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight)
            return document.body.scrollHeight
        })

        // If scrolling doesn't load more content, exit the loop
        if (currentHeight === previousHeight) break

        previousHeight = currentHeight

        // Extract image URLs after scrolling
        const newImageUrls = await page.evaluate(() => {
            const images = document.querySelectorAll('img')
            return Array.from(images).map((img) => {
                const url = img.getAttribute('src')
                if (url.includes('pinimg') && img.width > 75) return url
                else return ''
            })
        })

        // Add the new image URLs to the result
        imageUrls = [...imageUrls, ...newImageUrls]

        // Wait for some time before scrolling again
        await page.waitForTimeout(250) // Adjust this wait time as needed
    }
    // [...new Set(imageUrls)].forEach((item, i) => console.log(i, item))
    // fs.writeFileSync('/home/guillermo/Documents/git/bydanygarcia-api/api/helpers/scrapped.html', await page.content());
    await browser.close()

    return [...new Set(imageUrls)]
}

module.exports = { scrapePage }