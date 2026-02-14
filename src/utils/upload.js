const cloudinary = require("../utils/cloudinary");

const uploadImage = async (filePath) => {
  const result = await cloudinary.uploader.upload(filePath, {
     folder: "products",
  });

  return result.secure_url;
};

module.exports = uploadImage;
