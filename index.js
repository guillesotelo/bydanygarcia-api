const express = require("express")
const morgan = require("morgan")
const cors = require('cors')
const { connection } = require("./api/db")
const routes = require("./api/routes")
const { scrapePage } = require("./api/helpers/scraper")
const { ScrappedImage } = require("./api/db/models")
const app = express()
const PORT = process.env.PORT || 5000
const AUTO_SCRAPPER = process.env.AUTO_SCRAPPER || null
let intervalId = null

const scrapeAndSaveImages = async () => {
  const scrape = async () => {
    const arrangementsUrl = 'https://www.pinterest.se/bespoken_ar/flower-arrangements/'
    const adornmentsUrl = 'https://www.pinterest.se/bespoken_ar/flower-adornments/'
    const giftsUrl = 'https://www.pinterest.se/bespoken_ar/bespoken-gifts/'
    const weddingUrl = 'https://www.pinterest.se/bespoken_ar/our-diy-wedding/'
    try {
      console.log('Auto Scraping URLs...')
      const arrangementsImages = await scrapePage(arrangementsUrl)
      const adornmentsImages = await scrapePage(adornmentsUrl)
      const giftsImages = await scrapePage(giftsUrl)
      const weddingImages = await scrapePage(weddingUrl)

      if (arrangementsImages && arrangementsImages.length) {
        console.log('Saving arrangementsImages...')
        await ScrappedImage.findOneAndUpdate({ gallery: 'arrangements' }, { urls: JSON.stringify(arrangementsImages) })
      }
      if (adornmentsImages && adornmentsImages.length) {
        console.log('Saving adornmentsImages...')
        await ScrappedImage.findOneAndUpdate({ gallery: 'adornments' }, { urls: JSON.stringify(adornmentsImages) })
      }
      if (giftsImages && giftsImages.length) {
        console.log('Saving giftsImages...')
        await ScrappedImage.findOneAndUpdate({ gallery: 'gifts' }, { urls: JSON.stringify(giftsImages) })
      }
      if (weddingImages && weddingImages.length) {
        console.log('Saving weddingImages...')
        await ScrappedImage.findOneAndUpdate({ gallery: 'wedding' }, { urls: JSON.stringify(weddingImages) })
      }
    } catch (err) {
      console.error('Error in scrapeAndSaveImages', err)
    }
  }

  clearInterval(intervalId)
  await scrape()
  intervalId = setInterval(scrape, 300000)
}

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH']
}))

app.use(morgan("dev"))

app.use(express.json({ limit: '200mb' }))
app.use(express.urlencoded({ limit: '200mb', extended: true, parameterLimit: 1000000 }))

app.use("/api", routes)

app.use((err, _, res, __) => {
  console.error(err.stack)
  res.status(500).send("Something broke!")
})

app.get('/', (req, res) => res.status(200).send('An Echo of the Heart (API Status: OK)'))

// if(process.env.NODE_ENV === 'production') {
//   app.use(express.static('build'))
//   app.get('*', (req, res) => {
//     res.sendFile(path.resolve(__dirname, 'build', 'index.html'))
//   })
// }

connection.on("error", console.error.bind("Connection error: ", console))

connection.once("open", () => {
  app.listen(PORT, () => console.log(`* Server listening on Port: ${PORT}... *`))
  // scrapeAndSaveImages()
})


module.exports = app