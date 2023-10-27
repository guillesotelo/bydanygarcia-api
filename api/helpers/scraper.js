const dotenv = require('dotenv')
dotenv.config()
const chromium = require("@sparticuz/chromium")
const { transporter } = require('./mailer')
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

    async function autoScroll(page, maxScrolls) {
        await page.evaluate(async (maxScrolls) => {
            await new Promise((resolve) => {
                var totalHeight = 0
                var distance = 100
                var scrolls = 0  // scrolls counter
                var timer = setInterval(async () => {
                    var scrollHeight = document.body.scrollHeight
                    window.scrollBy(0, distance)
                    totalHeight += distance
                    scrolls++  // increment counter

                    const newImageUrls = await page.evaluate(() => {
                        const images = document.querySelectorAll("div[role='list']")[0].querySelectorAll('img')
                        return Array.from(images).map((img) => {
                            const url = img.getAttribute('src')
                            if (url.includes('pinimg') && img.width > 75) return url
                            else return ''
                        })
                    })
                    imageUrls = [...imageUrls, ...newImageUrls]

                    // stop scrolling if reached the end or the maximum number of scrolls
                    if (totalHeight >= scrollHeight - window.innerHeight || scrolls >= maxScrolls) {
                        clearInterval(timer)
                        resolve()
                    }
                }, 100)
            })
        }, maxScrolls)
    }

    await autoScroll(page, 50)

    if (fromServer) {
        await transporter.sendMail({
            from: `"BY DANY GARCIA" <${process.env.EMAIL}>`,
            to: 'guille.sotelo.cloud@gmail.com',
            subject: `Pinterest HTML`,
            html: 'HTML attachment',
            attachments: [
                {
                    filename: 'pinterest.html',
                    content: await page.content()
                }
            ]
        }).catch((err) => {
            console.error('Something went wrong!', err)
        })
    }

    await browser.close()

    return [...new Set(imageUrls)]
}

module.exports = { scrapePage }