const dummy = (_blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    return blogs
        .map(blog => blog.likes)
        .reduce((previousValue, likes) => previousValue + likes, 0)
}

const favoriteBlog = (blogs) => {
    if (blogs.length === 0) {
        return undefined
    }

    const highestLikes = (previousValue, blog) => {
        if (previousValue === null) {
            return blog
        }

        if (blog.likes > previousValue.likes) {
            return blog
        }

        return previousValue
    }

    const highest = blogs.reduce(highestLikes, null)

    return {
        title: highest.title,
        author: highest.author,
        likes: highest.likes,
    }
}

const mostBlogs = (blogs) => {
    if (blogs.length === 0) {
        return undefined
    }

    const blogCountByAuthor = blogs.reduce((map, current) => {
        const oldValue = map.get(current.author) || 0

        map.set(current.author, oldValue + 1)
        return map
    }, new Map())

    const most = Array.from(blogCountByAuthor.entries())
        .map(entry => {
            return {
                author: entry[0],
                blogs: entry[1],
            }
        })
        .reduce((previousHighest, current) => {
            if (previousHighest === undefined) {
                return current
            }

            if (current.blogs > previousHighest.blogs) {
                return current
            }

            return previousHighest
        }, undefined)

    return most
}

const mostLikes = (blogs) => {
    if (blogs.length === 0) {
        return undefined
    }

    const likesByAuthor = blogs.reduce((likes, current) => {
        const oldValue = likes.get(current.author) || 0

        likes.set(current.author, oldValue + current.likes)
        return likes
    }, new Map())

    const most = Array.from(likesByAuthor.entries())
        .map(entry => {
            return {
                author: entry[0],
                likes: entry[1],
            }
        })
        .reduce((previousHighest, current) => {
            if (previousHighest === undefined) {
                return current
            }

            if (current.likes > previousHighest.likes) {
                return current
            }

            return previousHighest
        }, undefined)

    return most
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes,
}
