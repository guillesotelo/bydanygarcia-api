const dotenv = require('dotenv')
dotenv.config()
const chromium = require("@sparticuz/chromium");
const fromServer = process.env.AWS_LAMBDA_FUNCTION_VERSION
puppeteer = fromServer ? require('puppeteer-core') : require('puppeteer')

const scrapePage = async (url, selector) => {
    let browser = null
    if (fromServer) {
        chromium.setHeadlessMode = true;
        chromium.setGraphicsMode = false;

        browser = await puppeteer.launch({
            ignoreDefaultArgs: ['--disable-extensions'],
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
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

    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Scroll down repeatedly until all images are loaded
    let imageUrls = [];
    let previousHeight;
    while (true) {
        const currentHeight = await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
            return document.body.scrollHeight;
        });

        if (currentHeight === previousHeight) {
            break; // If scrolling doesn't load more content, exit the loop
        }

        previousHeight = currentHeight;

        // Extract image URLs after scrolling
        const newImageUrls = await page.evaluate(() => {
            const images = document.querySelectorAll('img');
            return Array.from(images).map((img) => {
                const url = img.getAttribute('src');
                if (url.includes('pinimg') && img.width > 75) return url;
                else return '';
            });
        });

        // Add the new image URLs to the result
        imageUrls = [...imageUrls, ...newImageUrls];

        // Wait for some time before scrolling again
        await page.waitForTimeout(250); // Adjust this wait time as needed
    }
    await browser.close();

    return [...new Set(imageUrls)]
}

module.exports = { scrapePage }