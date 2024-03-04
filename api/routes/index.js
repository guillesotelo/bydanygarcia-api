const express = require('express')
const router = express.Router()
const { verifyToken } = require('../helpers')

const userRoutes = require('./user')
const postRoutes = require('./post')
const appRoutes = require('./app')
const commentRoutes = require('./comment')
const emailTemplateRoutes = require('./emailTemplate')

router.use('/user', userRoutes)
router.use('/post', postRoutes)
router.use('/app', appRoutes)
router.use('/comment', commentRoutes)
router.use('/template', emailTemplateRoutes)

module.exports = router, verifyToken