const express = require('express')
const router = express.Router()
const { verifyToken } = require('../helpers')

const userRoutes = require('./user')
const postRoutes = require('./post')

router.use('/user', userRoutes)
router.use('/post', postRoutes)

module.exports = router, verifyToken