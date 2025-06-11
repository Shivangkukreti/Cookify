require('dotenv').config()
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name:process.env.cloudname,
    api_secret:process.env.apisecret,
    api_key:process.env.apikey,
});
const storage = new CloudinaryStorage({
cloudinary: cloudinary,
params: {
    folder: 'foldername',
    allowed_formats: ['jpeg', 'png', 'jpg', 'gif'], 
    transformation: [{ width: 800, height: 800, crop: 'limit' }]
}
});
module.exports={cloudinary,storage}


