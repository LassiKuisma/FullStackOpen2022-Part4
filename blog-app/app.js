const config = require('./utils/config')
const express = require('express')
const app = express()
const cors = require('cors')

const blogsRouter = require('./controllers/blogs')

const middleware = require('./utils/middleware')
const logger = require('./utils/logger')

const mongoose = require('mongoose')


logger.info('connecting to mongo')

mongoose.connect(config.MONGODB_URI)
    .then(() => {
        logger.info('connected to mongo db')
    })
    .catch(error => {
        logger.error('error connecting to mongo:', error.message)
    })

app.use(cors())
app.use(express.json())

app.use('/api/blogs', blogsRouter)

app.use(middleware.errorHandler)
app.use(middleware.unknownEndpoint)

module.exports = app
