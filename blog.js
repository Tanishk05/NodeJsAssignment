const express = require('express');
const axios = require("axios");
const l1 = require("lodash");
const l2 = require("lodash-contrib");
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server Listening on PORT:", PORT);
});

// 1) Data Retrieval
let blogs = [];

const callApi = async () => {
    const config = {
        headers: {
            "x-hasura-admin-secret": "32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6"
        }
    };

    const url = "https://intent-kit-16.hasura.app/api/rest/blogs";


    await axios.get(url, config)
        .then(data => blogs = data.data.blogs);
}

app.get("/api/blog-stats", async (request, response) => {
    try {
        await callApi();
        // 2) Data Analysis
        let frequency_of_word = [];
        frequency_of_word = blogs.map(data => l2.strContains(data.title.toLowerCase(), "privacy"));

        const total_no_of_blogs = l1.size(blogs);

        const blog_with_longest_title = l1.maxBy(blogs, data => l1.size(data.title));

        const frequency = l2.frequencies(frequency_of_word);

        let no_of_title_with_privacy = 0;

        if ("true" in frequency) {
            no_of_title_with_privacy = frequency.true;
        }

        const unique_titles = l1.uniqBy(blogs, data => data.title)

        // 3) Response
        const data = {
            "Total no of blogs": total_no_of_blogs,
            "Title of longest blog": blog_with_longest_title.title,
            "Number of blogs with privacy in title": no_of_title_with_privacy,
            "Array of unique blogs": unique_titles
        }

        response.send(data);
    } catch (error) {
        response.send(error.message);
    }
});

// 4) Blog Search Endpoint
app.get("/api/blog-search", async (request, response) => {
    try {
        await callApi();
        // 6) Bonus Challenge
        const getFilteredBlogs = l1.memoize(async () => {
            const query = request.query.query;
            const result = blogs.filter(data => data.title.toLowerCase().includes(query.toLowerCase()));
            return result;
        })
        const filtered_blogs = await getFilteredBlogs();
        if (filtered_blogs.length == 0) {
            response.send("No blog found with given query string");
        } else {
            response.send(filtered_blogs);
        }
    } catch (error) {
        response.send(error.message);
    }
});