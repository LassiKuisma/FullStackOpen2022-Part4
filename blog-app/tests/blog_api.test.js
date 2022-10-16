const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)

const Blog = require('../models/blog')
const User = require('../models/user')

describe('when there are initially some blogs in db', () => {
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
        const response = await api
            .get('/api/blogs')
            .expect(200)
            .expect('Content-Type', /application\/json/)

        expect(response.body).toHaveLength(helper.initialBlogs.length)
    })

    test('a specific blogs is within the returned blogs', async () => {
        const response = await api
            .get('/api/blogs')
            .expect(200)
            .expect('Content-Type', /application\/json/)

        const responseTitles = response.body.map(blog => blog.title)

        expect(responseTitles).toContain(
            'Another test in the blog'
        )
    })

    test('blogs have a defined id', async () => {
        const response = await api
            .get('/api/blogs')
            .expect(200)
            .expect('Content-Type', /application\/json/)

        const first = response.body[0]
        expect(first.id).toBeDefined()
    })

    test('posting a new blog without specifying token fails with statuscode and message', async () => {
        const blogsAtStart = await helper.blogsInDb()

        const newBlog = {
            title: 'I have no tokens',
            author: 'Person Person',
            url: 'url #2',
            likes: 1,
        }

        const result = await api.post('/api/blogs')
            .send(newBlog)
            .expect(401)
            .expect('Content-Type', /application\/json/)


        expect(result.body.error).toContain('token missing or invalid')

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(blogsAtStart.length)

        expect(blogsAtEnd).toEqual(blogsAtStart)
    })

    test('deleting a blog without sending token fails with statuscode and message', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToDelete = blogsAtStart[0]
        const id = blogToDelete.id

        const result = await api
            .delete(`/api/blogs/${id}`)
            .expect(401)
            .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('token missing or invalid')


        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(blogsAtStart.length)

        expect(blogsAtEnd).toEqual(blogsAtStart)
    })

    test('posting a new blog using an invalid token fails with statuscode and message', async () => {
        const blogsAtStart = await helper.blogsInDb()

        const newBlog = {
            title: 'I have no tokens',
            author: 'Person Person',
            url: 'url #2',
            likes: 1,
        }

        const token = 'eyyImInvalidToken'

        const result = await api.post('/api/blogs')
            .send(newBlog)
            .set('Authorization', `Bearer ${token}`)
            .expect(401)
            .expect('Content-Type', /application\/json/)


        expect(result.body.error).toContain('invalid token')

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(blogsAtStart.length)

        expect(blogsAtEnd).toEqual(blogsAtStart)
    })
})

describe('using a valid token after logging in', () => {
    beforeEach(async () => {
        await User.deleteMany({})

        const passwordHash = await bcrypt.hash('cats', 10)
        const user = new User({
            username: 'cats',
            name: 'Cats',
            passwordHash,
        })

        await user.save()
        const userId = user._id


        await Blog.deleteMany({})

        for (let blog of helper.initialBlogs) {
            let blogObject = new Blog(blog)
            blogObject.user = userId
            await blogObject.save()
            user.blogs = user.blogs.concat(blogObject._id.toString())
            await user.save()
        }
    })

    const getLoginToken = async () => {
        const loginDetails = {
            username: 'cats',
            password: 'cats'
        }

        const loginResult = await api
            .post('/api/login')
            .send(loginDetails)
            .expect(200)

        const token = loginResult.body.token
        expect(token).not.toBe(null)

        return token
    }

    test('user can post new blogs', async () => {
        const token = await getLoginToken()

        const newBlog = {
            title: 'How to add blogs using tokens to authenticate',
            author: 'Jorma',
            url: 'asd',
            likes: 500,
        }

        await api.post('/api/blogs')
            .send(newBlog)
            .set('Authorization', `Bearer ${token}`)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

        const contents = blogsAtEnd.map(b => b.title)
        expect(contents).toContain('How to add blogs using tokens to authenticate')
    })

    test('posting a blog without specifying amount of likes creates new blog with zero likes', async () => {
        const token = await getLoginToken()

        const newBlog = {
            title: 'A blog with no likes',
            author: 'Dewey',
            url: 'url #3',
        }

        await api.post('/api/blogs')
            .send(newBlog)
            .set('Authorization', `Bearer ${token}`)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await helper.blogsInDb()
        const blog = blogsAtEnd.find(blog => blog.title === 'A blog with no likes')

        expect(blog.likes).toBe(0)
    })

    test('posting a blog without title fails with statuscode and message', async () => {
        const token = await getLoginToken()

        const newBlog = {
            author: 'Missing Title',
            url: 'url #4',
            likes: 777,
        }

        await api.post('/api/blogs')
            .send(newBlog)
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
    })

    test('posting a blog without author fails with statuscode and message', async () => {
        const token = await getLoginToken()

        const newBlog = {
            title: 'Title is present, but author nowehere to be seen',
            url: 'url #5',
            likes: 123,
        }

        await api.post('/api/blogs')
            .send(newBlog)
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
    })

    test('blog posts can be deleted', async () => {
        const token = await getLoginToken()

        const blogsAtStart = await helper.blogsInDb()
        const blogToDelete = blogsAtStart[0]
        const blogId = blogToDelete.id


        const userBlogsAtStart = (await helper.usersInDb())
            .find(user => user.username === 'cats')
            .blogs
            .map(blog => blog._id.toString())

        expect(userBlogsAtStart).toContain(blogId)

        await api
            .delete(`/api/blogs/${blogId}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(204)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)

        const titles = blogsAtEnd.map(blog => blog.title)
        expect(titles).not.toContain(blogToDelete.title)

        const userBlogsAtEnd = (await helper.usersInDb())
            .find(user => user.username === 'cats')
            .blogs
            .map(blog => blog._id.toString())

        expect(userBlogsAtEnd).not.toContain(blogId)
    })

    test('deleting blog post that doesnt exist fails with statuscode and message', async () => {
        const token = await getLoginToken()

        const blogsAtStart = await helper.blogsInDb()
        const blogIdLength = blogsAtStart[0].id.length

        const badId = '1'.repeat(blogIdLength)

        await api
            .delete(`/api/blogs/${badId}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(404)
    })

    test('blog posts can be modified', async () => {
        const token = await getLoginToken()

        const blogsAtStart = await helper.blogsInDb()
        const blogToModify = blogsAtStart[0]
        const id = blogToModify.id

        const newBlog = {
            likes: 10000,
        }

        await api
            .put(`/api/blogs/${id}`)
            .send(newBlog)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)

        const updatedBlog = blogsAtEnd.find(blog => blog.title === 'Test blog #1')
        expect(updatedBlog.likes).toBe(10000)
    })

    test('modifying blog post that doesnt exist doesnt change any existing blogs', async () => {
        const token = await getLoginToken()

        const blogsAtStart = await helper.blogsInDb()
        const blogIdLength = blogsAtStart[0].id.length

        const badId = '1'.repeat(blogIdLength)

        const newBlog = {
            likes: 10000,
        }

        await api
            .put(`/api/blogs/${badId}`)
            .send(newBlog)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)

        const blogLikes = blogsAtEnd.map(blog => blog.likes)
        expect(blogLikes).not.toContain(10000)
    })

    test('deleting a blog someone else posted fails', async () => {
        const passwordHash = await bcrypt.hash('asddas', 10)
        const user = new User({
            username: 'asddas',
            name: 'asddas',
            passwordHash,
        })

        await user.save()

        // login with new user
        const loginDetails = {
            username: 'asddas',
            password: 'asddas'
        }

        const loginResult = await api
            .post('/api/login')
            .send(loginDetails)
            .expect(200)

        const token = loginResult.body.token
        expect(token).not.toBe(null)


        // blogs are posted by the other user, created earlier
        const blogsAtStart = await helper.blogsInDb()
        const blogToDelete = blogsAtStart[0]
        const blogId = blogToDelete.id

        const result = await api
            .delete(`/api/blogs/${blogId}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(401)
            .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('unauthorized')


        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
    })
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
