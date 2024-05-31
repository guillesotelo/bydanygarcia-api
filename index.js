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
  const arrangementsUrl = 'https://www.pinterest.se/bespoken_ar/flower-arrangements/'
  const adornmentsUrl = 'https://www.pinterest.se/bespoken_ar/flower-adornments/'
  const giftsUrl = 'https://www.pinterest.se/bespoken_ar/bespoken-gifts/'
  const weddingUrl = 'https://www.pinterest.se/bespoken_ar/our-diy-wedding/'

  clearInterval(intervalId)
  intervalId = setInterval(async () => {
    try {
      const arrangementsImages = await scrapePage(arrangementsUrl)
      const adornmentsImages = await scrapePage(adornmentsUrl)
      const giftsImages = await scrapePage(giftsUrl)
      const weddingImages = await scrapePage(weddingUrl)

      if (arrangementsImages && arrangementsImages.length) await ScrappedImage.create({ urls: arrangementsImages, gallery: 'arrangements', scrapUrl: arrangementsUrl })
      if (adornmentsImages && adornmentsImages.length) await ScrappedImage.create({ urls: adornmentsImages, gallery: 'adornments', scrapUrl: adornmentsUrl })
      if (giftsImages && giftsImages.length) await ScrappedImage.create({ urls: giftsImages, gallery: 'gifts', scrapUrl: giftsUrl })
      if (weddingImages && weddingImages.length) await ScrappedImage.create({ urls: weddingImages, gallery: 'wedding', scrapUrl: weddingUrl })
    } catch (err) {
      console.error('Error in scrapeAndSaveImages', err)
    }
  }, 3000000)
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

app.get('/', (req, res) => res.status(200).send('By Dany Garcia (API Status: OK)'))

// if(process.env.NODE_ENV === 'production') {
//   app.use(express.static('build'))
//   app.get('*', (req, res) => {
//     res.sendFile(path.resolve(__dirname, 'build', 'index.html'))
//   })
// }

connection.on("error", console.error.bind("Connection error: ", console))

connection.once("open", () => {
  app.listen(PORT, () => console.log(`* Server listening on Port: ${PORT}... *`))
  if (AUTO_SCRAPPER) scrapeAndSaveImages()
})


module.exports = app