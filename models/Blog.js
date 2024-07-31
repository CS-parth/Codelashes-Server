const mongoose = require('mongoose');

const blogSchema = mongoose.Schema({
    content: String,
    title:String,
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
    }
},
{timestamps: true});

const Blog = mongoose.model('Blog',blogSchema);

module.exports = Blog;