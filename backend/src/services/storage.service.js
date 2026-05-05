const ImageKit = require('imagekit');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

function isDummyStorage() {
  return process.env.DUMMY_STORAGE === '1';
}

function looksLikePlaceholder(value) {
  if (!value) return true;
  const v = String(value).toLowerCase();
  return v.startsWith('your_') || v.includes('placeholder') || v.includes('your imagekit');
}

let imagekit = null;
if (!isDummyStorage()) {
  imagekit = new ImageKit({
    privateKey: process.env.PRIVATE_KEY,
    publicKey: process.env.PUBLIC_KEY,
    urlEndpoint: process.env.URL,
  });
}

const uploadFile = async (file, fileName) => {
  if (isDummyStorage()) {
    return { url: `https://dummy.local/${encodeURIComponent(fileName)}` };
  }

  if (!imagekit) {
    throw new Error('ImageKit is not configured');
  }

  if (
    looksLikePlaceholder(process.env.PRIVATE_KEY) ||
    looksLikePlaceholder(process.env.PUBLIC_KEY) ||
    looksLikePlaceholder(process.env.URL)
  ) {
    const err = new Error('ImageKit credentials are not configured (placeholders found in backend/.env)');
    err.code = 'IMAGEKIT_NOT_CONFIGURED';
    throw err;
  }

  try {
    const result = await imagekit.upload({
      file,
      fileName,
    });

    return result;
  } catch (error) {
    const msg =
      error?.message ||
      error?.help ||
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      'Unknown ImageKit error';

    const err = new Error(String(msg));
    err.code = 'IMAGEKIT_UPLOAD_FAILED';
    err.cause = error;
    throw err;
  }
};

module.exports = {
  uploadFile,
};

