const router = require('express').Router()
const Blog = require('../models/blog')

router.get('/', async (_request, response) => {
    const blogs = await Blog.find({})
    response.json(blogs)
})

router.post('/', async (request, response) => {
    const body = request.body

    const blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes || 0
    })

    const result = await blog.save()
    response.status(201).json(result)
})

module.exports = router
