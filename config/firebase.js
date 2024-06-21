const admin = require('firebase-admin');
const serviceAccount = require('./codelashes-firebase-adminsdk-h3pkb-c742a1715e.json');
const fs = require('fs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { model } = require('mongoose');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'gs://codelashes.appspot.com'
});

const bucket = admin.storage().bucket();

const uploadToFirebase = async (filePath,destFileName) => {
    try{
        const uuid = uuidv4();
        await bucket.upload(filePath,{
          destination: destFileName,
          metadata: {
              metadata: {
                  firebaseStorageDownloadTokens: uuid,
              }
          },
        });

        const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${destFileName}?alt=media`;
        // console.log(`File ${filePath} uploaded to ${fileUrl}`);
        return {fileUrl,uuid};
    }catch(err){
        console.error('Error uploading file : ',err);
    }
}

const removeFromFirebase = async (fileUrl) => {
    try {
      const filePathWithoutBaseUrl = fileUrl.split('firebasestorage.googleapis.com/v0/b/')[1].split('?')[0];
      const bucketName = filePathWithoutBaseUrl.split('/o/')[0];
      const filePath = filePathWithoutBaseUrl.split(`${bucketName}/o/`)[1];
      await bucket.file(filePath).delete();
      console.log(`File ${fileUrl} removed from Firebase Storage`);
    } catch (err) {
      console.error(`Error removing file ${fileUrl}:`, err);
    }
};

const fetchFileFromFirebase = async (fileUrl, destinationPath) => {
    try {
      const filePathWithoutBaseUrl = fileUrl.split('firebasestorage.googleapis.com/v0/b/')[1].split('?')[0];
      const bucketName = filePathWithoutBaseUrl.split('/o/')[0];
      const filePath = filePathWithoutBaseUrl.split(`${bucketName}/o/`)[1];
      const file = bucket.file(filePath);
      const fileStream = file.createReadStream();
      const dest = fs.createWriteStream(destinationPath);
      fileStream.pipe(dest);
      console.log(`File ${fileUrl} downloaded from Firebase Storage to ${destinationPath}`);
    } catch (err) {
      console.error(`Error downloading file ${fileUrl}:`, err);
    }
};

const genUniqueFileName = ()=>{
  const timestamp = new Date().getTime();
  const randomString = crypto.randomBytes(3).toString('hex');
  return `${timestamp}_${randomString}`;
}

const getFileName = (fileUrl) => {
  console.log(fileUrl);
  return fileUrl.split("/o/")[1].split("?")[0].split(".txt")[0];
}
module.exports = { uploadToFirebase, removeFromFirebase, fetchFileFromFirebase, genUniqueFileName , getFileName};