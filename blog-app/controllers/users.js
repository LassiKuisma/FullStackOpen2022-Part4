const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')

usersRouter.post('/', async (request, response) => {
    const { username, name, password } = request.body

    if (!username) {
        response.status(400).json({
            error: 'missing username'
        })
    }

    if (!password) {
        response.status(400).json({
            error: 'missing password'
        })
    }

    if (username.length < 3) {
        response.status(400).json({
            error: 'username must be over 3 characters'
        })
    }

    if (password.length < 3) {
        response.status(400).json({
            error: 'password must be over 3 characters'
        })
    }

    const existingUser = await User.findOne({ username })
    if (existingUser) {
        response.status(400).json({
            error: 'username is taken'
        })
    }

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    const user = new User({
        username,
        name,
        passwordHash,
    })

    const saved = await user.save()

    response.status(201).json(saved)
})

usersRouter.get('/', async (_request, response) => {
    const users = await User
        .find({}).populate('blogs', { title: 1, author: 1, url: 1 })

    response.json(users)
})

module.exports = usersRouter
