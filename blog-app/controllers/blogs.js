const router = require('express').Router()
const Blog = require('../models/blog')

router.get('/', (_request, response, next) => {
    Blog.find({})
        .then(blogs => {
            response.json(blogs)
        })
        .catch(error => next(error))
})

router.post('/', (request, response, next) => {
    const body = request.body

    const blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes || 0
    })

    blog
        .save()
        .then(result => {
            response.status(201).json(result)
        })
        .catch(error => next(error))
})

module.exports = router
