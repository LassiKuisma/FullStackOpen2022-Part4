const logger = require('./logger')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

const unknownEndpoint = (_request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}

const errorHandler = (error, _request, response, next) => {
    logger.error(error.message)

    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformatted id' })
    } else if (error.name === 'ValidationError') {
        return response.status(400).json({ error: error.message })
    } else if (error.name === 'JsonWebTokenError') {
        return response.status(401).json({
            error: 'invalid token'
        })
    }

    next(error)
}

const tokenExtractor = (request, _response, next) => {
    const authorization = request.get('authorization')
    if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
        const token = authorization.substring(7)
        request.token = token
    }

    next()
}

const userExtractor = async (request, _response, next) => {
    if (!request.token) {
        next()
        return
    }

    const decodedToken = jwt.verify(request.token, process.env.SECRET)
    if (decodedToken.id) {
        const user = await User.findById(decodedToken.id)
        request.user = user
    }

    next()
}

module.exports = {
    errorHandler,
    unknownEndpoint,
    tokenExtractor,
    userExtractor,
}
