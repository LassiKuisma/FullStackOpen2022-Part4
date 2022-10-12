const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)

const Blog = require('../models/blog')

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

afterAll(() => {
    mongoose.connection.close()
})
