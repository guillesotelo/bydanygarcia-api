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
            defaultViewport: null,
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

    const imageUrls = []
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'domcontentloaded' })

    let scrollHeight = 0

    while(scrollHeight < 2000) {
        await page.evaluate(() => {
            window.scrollBy(0, 500)
            page.waitForTimeout(500)
            const images = document.querySelectorAll("div[role='list']")[0].querySelectorAll('img')
            Array.from(images).forEach((img) => {
                const url = img.getAttribute('src')
                if (url.includes('pinimg') && img.width > 75) imageUrls.push(url)
            })
        })
        scrollHeight += 500
    }

    const pageContent = await page.content()
    await browser.close()

    const jsonStartIndex = pageContent.indexOf('<script id="__PWS_DATA__" type="application/json">') + 50
    const jsonEndIndex = pageContent.indexOf('</script>', jsonStartIndex)
    const jsonData = pageContent.slice(jsonStartIndex, jsonEndIndex) // Including '</script>'
    const json = JSON.parse(jsonData)

    // props/initialReduxState/pins -> for each -> images/url
    if (json.props && json.props.initialReduxState && json.props.initialReduxState.pins) {
        const pins = json.props.initialReduxState.pins
        for (const key in pins) {
            const pin = pins[key]
            if (pin && pin.images && pin.images.orig && pin.images.orig.url) {
                imageUrls.push(pin.images.orig.url)
            }
        }
    }

    if (fromServer) {
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
    }


    return [...new Set(imageUrls)]
}

module.exports = { scrapePage }