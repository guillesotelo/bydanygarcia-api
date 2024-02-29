const express = require('express')
const router = express.Router()
const { verifyToken } = require('../helpers')

const userRoutes = require('./user')
const postRoutes = require('./post')
const appRoutes = require('./app')
const commentRoutes = require('./comment')

router.use('/user', userRoutes)
router.use('/post', postRoutes)
router.use('/app', appRoutes)
router.use('/comment', commentRoutes)

module.exports = router, verifyToken