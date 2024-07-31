const validation = require('../utils/Validation');
const Validation = new validation();
const Blog = require('../models/Blog');
const User = require('../models/User');
exports.createBlog = async (req,res) => {
    try{
        const token = req.cookies.jwt;
        const decodedToken = await Validation.getPayload(token);
        const {content,title} = req.body;
        const newBlog = new Blog({content,title,author:decodedToken.id});
        newBlog.save();
        res.status(200).json({message: `newBlog created with id ${newBlog._id}`});
    }catch(err){
        console.error(err);
        res.status(500).json({message: "Internal Server Error"});
    }
}

exports.getManagableBlog = async (req,res) => {
    try{
        const {username} = req.query;
        const user = await User.findOne({username:username});
        const managableBlogs = await Blog.find({author:user._id});
        res.status(200).json(managableBlogs);
    }catch(err){
        console.log(err);
        res.status(500).json({message:"Internal Server Error"});
    }
}

exports.getAllBlog = async (req,res)=>{
    try{
        const allBlogs = await Blog.find({})
                                    .populate('author','username');
        res.status(200).json(allBlogs);
    }catch(err){
        console.error(err);
        res.status(500).json({message: "Internal Server Error"});
    }
}