const Blog = require('../models/blog')

const initialBlogs = [
    {
        title: 'Test blog #1',
        author: 'Tester man',
        url: 'url #1',
        likes: 123,
    },
    {
        title: 'Another test in the blog',
        author: 'Magenta Anderson',
        url: 'qweasdzxc',
        likes: 999,
    },
]

const blogsInDb = async () => {
    const blogs = await Blog.find({})
    return blogs.map(blog => blog.toJSON())
}

module.exports = {
    initialBlogs, blogsInDb
}
