const dotenv = require('dotenv')
dotenv.config()
const chromium = require("@sparticuz/chromium")
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
            args: [
                '--allow-pre-commit-input',
                // '--disable-background-networking',
                // '--disable-background-timer-throttling',
                // '--disable-backgrounding-occluded-windows',
                '--disable-breakpad',
                '--disable-client-side-phishing-detection',
                // '--disable-component-extensions-with-background-pages',
                // '--disable-component-update',
                '--disable-default-apps',
                '--disable-dev-shm-usage',
                '--disable-extensions',
                '--disable-hang-monitor',
                '--disable-ipc-flooding-protection',
                '--disable-popup-blocking',
                '--disable-prompt-on-repost',
                // '--disable-renderer-backgrounding',
                // '--disable-sync',
                // '--enable-automation',
                // '--enable-blink-features=IdleDetection',
                '--export-tagged-pdf',
                '--force-color-profile=srgb',
                '--metrics-recording-only',
                // '--no-first-run',
                '--password-store=basic',
                '--use-mock-keychain',
                '--disable-domain-reliability',
                // '--disable-print-preview',
                '--disable-speech-api',
                '--disk-cache-size=33554432',
                '--mute-audio',
                // '--no-default-browser-check',
                // '--no-pings',
                // '--single-process',
                // '--disable-features=Translate,BackForwardCache,AcceptCHFrame,MediaRouter,OptimizationHints,AudioServiceOutOfProcess,IsolateOrigins,site-per-process',
                // '--enable-features=NetworkServiceInProcess2,SharedArrayBuffer',
                '--hide-scrollbars',
                '--ignore-gpu-blocklist',
                '--in-process-gpu',
                '--window-size=1920,1080',
                '--disable-webgl',
                '--allow-running-insecure-content',
                '--disable-setuid-sandbox',
                '--disable-site-isolation-trials',
                '--disable-web-security',
                '--no-sandbox',
                '--no-zygote',
                '--headless'
            ],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: 'always',
            ignoreHTTPSErrors: true
        })

        console.log('ARGS',chromium.args)
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
    
    while (true) {
        const currentHeight = await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight)
            return document.body.scrollHeight
        })

        if (currentHeight === previousHeight) {
            break
        }
        previousHeight = currentHeight

        const newImageUrls = await page.evaluate(() => {
            const images = document.querySelectorAll("div[role='list']")[0].querySelectorAll('img')
            return Array.from(images).map((img) => {
                const url = img.getAttribute('src')
                if (url.includes('pinimg') && img.width > 75) return url
                else return ''
            })
        })

        imageUrls = [...imageUrls, ...newImageUrls]

        await page.waitForTimeout(250)
    }
    await browser.close()

    return [...new Set(imageUrls)]
}

module.exports = { scrapePage }