const http = require('http')
const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const blogsRouter = require('./controllers/blogs')
const middleware = require('./utils/middleware')
const config = require('./utils/config')
const logger = require('./utils/logger')

const mongoUrl = config.MONGODB_URI
mongoose.connect(mongoUrl)
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

const PORT = config.PORT
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`)
})