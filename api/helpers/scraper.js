const dotenv = require('dotenv')
dotenv.config()
const chromium = require("@sparticuz/chromium")
const fromServer = process.env.AWS_LAMBDA_FUNCTION_VERSION || process.env.NODE_ENV === 'production'
puppeteer = fromServer ? require('puppeteer-core') : require('puppeteer')

const scrapePage = async (url, selector) => {
    try {
        let browser = null
        chromium.setHeadlessMode = true
        chromium.setGraphicsMode = false

        const puppeteerOptions =
            fromServer ?
                {
                    ignoreDefaultArgs: ['--disable-extensions'],
                    args: [...chromium.args, '--hide-scrollbars', '--disable-web-security', '--no-sandbox'],
                    defaultViewport: chromium.defaultViewport,
                    executablePath: await chromium.executablePath('/var/task/node_modules/@sparticuz/chromium/bin'),
                    headless: chromium.headless,
                    ignoreHTTPSErrors: true
                }
                :
                {
                    ignoreDefaultArgs: ['--disable-extensions'],
                    args: ['--hide-scrollbars', '--disable-web-security'],
                    headless: true,
                    ignoreHTTPSErrors: true
                }

        browser = await puppeteer.launch(puppeteerOptions)

        const page = await browser.newPage()

        await page.setViewport({
            width: 1920,
            height: 1080,
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

            // await page.waitForTimeout(250)
        }

        await page.close()
        await browser.close()

        return [...new Set(imageUrls)]
    } catch (error) {
        console.error(error)
        return []
    }
}

module.exports = { scrapePage }