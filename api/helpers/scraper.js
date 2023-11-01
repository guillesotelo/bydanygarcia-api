const dotenv = require('dotenv')
dotenv.config()
puppeteer = require('puppeteer')

const scrapePage = async (url, selector) => {
    let browser = null

    browser = await puppeteer.launch({
        ignoreDefaultArgs: ['--disable-extensions'],
        args: ['--hide-scrollbars', '--disable-web-security'],
        headless: 'always',
        ignoreHTTPSErrors: true
    })

    const page = await browser.newPage()
    await page.setViewport({
        height: 1080,
        width: 1920
    })
    await page.goto(url, { waitUntil: "domcontentloaded" })
    let imageUrls = []
    let previousHeight

    while (true) {
        const currentHeight = await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight)
            return document.body.scrollHeight
        })

        const newImageUrls = await page.evaluate(() => {
            const images = document.querySelectorAll("div[role='list']")[0].querySelectorAll('img')
            return Array.from(images).map((img) => {
                const url = img.getAttribute('src')
                if (url.includes('pinimg') && img.width > 75) return url
                else return ''
            })
        })

        imageUrls = [...imageUrls, ...newImageUrls]

        if (currentHeight === previousHeight) break
        previousHeight = currentHeight

        await page.waitForTimeout(250)
    }
    await browser.close()

    return [...new Set(imageUrls)]
}

module.exports = { scrapePage }