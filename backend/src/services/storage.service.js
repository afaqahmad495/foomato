 const ImageKit = require('imagekit')
 require('dotenv').config();


const imagekit = new ImageKit({
  privateKey: process.env.PRIVATE_KEY,
  publicKey: process.env.PUBLIC_KEY,
  urlEndpoint: process.env.URL,
   // This is the default and can be omitted
});

const uploadFile = async (file, fileName) =>{
    const result = await imagekit.upload({
        file: file,
        fileName: fileName
    })

    return result;
}

module.exports = {
    uploadFile
}

