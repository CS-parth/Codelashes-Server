const multer = require('multer'); // library to handle uploads via clients 

const storage = multer.diskStorage({})
const upload = multer({ storage: storage});

module.exports = upload; // upload is a middleware