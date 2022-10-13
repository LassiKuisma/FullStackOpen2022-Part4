const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)

const Blog = require('../models/blog')
const User = require('../models/user')

beforeEach(async () => {
    await Blog.deleteMany({})

    for (let blog of helper.initialBlogs) {
        let blogObject = new Blog(blog)
        await blogObject.save()
    }
})

test('blogs are returned as json', async () => {
    await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
})

test('corrent number of blogs is returned', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body).toHaveLength(helper.initialBlogs.length)
})

test('a specific blogs is within the returned blogs', async () => {
    const response = await api.get('/api/blogs')

    const responseTitles = response.body.map(blog => blog.title)

    expect(responseTitles).toContain(
        'Another test in the blog'
    )
})

test('blogs have unique id', async () => {
    const response = await api.get('/api/blogs')

    const first = response.body[0]
    expect(first.id).toBeDefined()
})

test('new blog can be posted', async () => {
    const newBlog = {
        title: 'Newly added blog',
        author: 'Person Person',
        url: 'url #2',
        likes: 1,
    }

    await api.post('/api/blogs')
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

    const contents = blogsAtEnd.map(b => b.title)
    expect(contents).toContain('Newly added blog')
})

test('posting a blog without specifying amount of likes creates new blog with zero likes', async () => {
    const newBlog = {
        title: 'A blog with no likes',
        author: 'Dewey',
        url: 'url #3',
    }

    await api.post('/api/blogs')
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    const blog = blogsAtEnd.find(blog => blog.title === 'A blog with no likes')

    expect(blog.likes).toBe(0)
})

test('trying to post a blog without title gives status 400', async () => {
    const newBlog = {
        author: 'Missing Title',
        url: 'url #4',
        likes: 777,
    }

    await api.post('/api/blogs')
        .send(newBlog)
        .expect(400)
})

test('trying to post a blog without author gives status 400', async () => {
    const newBlog = {
        title: 'Title is present, but author nowehere to be seen',
        url: 'url #5',
        likes: 123,
    }

    await api.post('/api/blogs')
        .send(newBlog)
        .expect(400)
})

test('blog posts can be deleted', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]
    const id = blogToDelete.id

    await api.delete(`/api/blogs/${id}`)
        .expect(204)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)

    const titles = blogsAtEnd.map(blog => blog.title)
    expect(titles).not.toContain(blogToDelete.title)
})

test('trying to delete blog post that doesnt exist gives status 404', async () => {
    const id = 123456

    await api.delete(`/api/blogs/${id}`)
        .expect(400)
})

test('blog posts can be modified', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToModify = blogsAtStart[0]
    const id = blogToModify.id

    const newBlog = {
        likes: 10000,
    }

    await api.put(`/api/blogs/${id}`)
        .send(newBlog)
        .expect(200)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)

    const updatedBlog = blogsAtEnd.find(blog => blog.title === 'Test blog #1')
    expect(updatedBlog.likes).toBe(10000)
})

test('trying to modify blog post that doesnt exist gives error', async () => {
    const id = 123321

    const newBlog = {
        likes: 10000,
    }

    await api.put(`/api/blogs/${id}`)
        .send(newBlog)
        .expect(400)

    const blogsAtEnd = await helper.blogsInDb()
    console.log(blogsAtEnd)
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
})

describe('when there is initially one user in db', () => {
    beforeEach(async () => {
        await User.deleteMany({})

        const passwordHash = await bcrypt.hash('initial guys password', 10)
        const user = new User({
            username: 'first',
            name: 'Guy First',
            passwordHash,
        })

        await user.save()
    })

    test('new user with unique username can be added', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'second',
            name: 'Guy First',
            password: 'asddsaqweewq',
        }

        await api
            .post('/api/users')
            .send(newUser)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

        const usernames = usersAtEnd.map(u => u.username)
        expect(usernames).toContain(newUser.username)
    })

    test('creation fails if username already taken', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'first',
            name: 'Uvuvwevwevwe Ossas',
            password: 'asddsaqweewq',
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('username is taken')

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toEqual(usersAtStart)
    })

    test('creation fails if username not given', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            name: 'Uvuvwevwevwe Ossas',
            password: 'asddsaqweewq',
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('missing username')

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toEqual(usersAtStart)
    })

    test('creation fails if username too short', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'sn',
            name: 'Mr Short Name',
            password: 'aaabbbccc',
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('username must be over 3 characters')

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toEqual(usersAtStart)
    })

    test('creation fails if password too short', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'uniquename',
            name: 'Mr long pword',
            password: 'a',
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('password must be over 3 characters')

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toEqual(usersAtStart)
    })

    test('creation fails if password not given', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'nopword',
            name: 'I dont need passwords',
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('missing password')

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toEqual(usersAtStart)
    })
})

afterAll(() => {
    mongoose.connection.close()
})
