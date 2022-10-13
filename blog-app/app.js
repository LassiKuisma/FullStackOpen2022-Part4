const config = require('./utils/config')
const express = require('express')
require('express-async-errors')
const app = express()
const cors = require('cors')

const blogsRouter = require('./controllers/blogs')
const usersRouter = require('./controllers/users')

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
app.use('/api/users', usersRouter)

app.use(middleware.errorHandler)
app.use(middleware.unknownEndpoint)

module.exports = app
