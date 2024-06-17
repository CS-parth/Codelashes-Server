const cloudinary = require('cloudinary');


cloudinary.config({
    cloud_name: "db9yuphuc",
    api_key: "922554534637976",
    api_secret: "_0MEvWOk7_vBfAcRBxm_XSqCivE"
})

uploadToCloudinary = (path,folder) => {
    return cloudinary.v2.uploader.upload(path,folder)
                                 .then((data)=>{
                                    return { url: data.url, public_id: data.public_id }
                                 })
                                 .catch((err)=>{
                                    console.error(err);
                                 })
}

removeFromCloudinary = async (public_id) => {
    await cloudinary.v2.uploader.destroy(public_id,function(err,result){
        console.log(result,err);
    })
}

module.exports = { uploadToCloudinary, removeEventListener };