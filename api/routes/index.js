const express = require('express')
const router = express.Router()
const { verifyToken } = require('../helpers')

const userRoutes = require('./user')
const postRoutes = require('./post')
const appRoutes = require('./app')

router.use('/user', userRoutes)
router.use('/post', postRoutes)
router.use('/app', appRoutes)

module.exports = router, verifyToken