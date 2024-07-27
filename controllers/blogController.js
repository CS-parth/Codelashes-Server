const validation = require('../utils/Validation');
const Validation = new validation();
const Blog = require('../models/Blog');
exports.createBlog = async (req,res) => {
    try{
        const token = req.cookies.jwt;
        const decodedToken = await Validation.getPayload(token);
        const {content} = req.body;
        const newBlog = new Blog({content,auther:decodedToken.id});
        newBlog.save();
        res.status(200).json({message: `newBlog created with id ${newBlog._id}`});
    }catch(err){
        console.error(err);
        res.status(500).json({message: "Internal Server Error"});
    }
}