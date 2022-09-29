const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    return blogs
        .map(blog => blog.likes)
        .reduce((previousValue, likes) => previousValue + likes, 0)
}

const mostLiked = (blogs) => {
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

module.exports = {
    dummy,
    totalLikes,
    mostLiked,
}
