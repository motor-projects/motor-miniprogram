const cloudinary = require('cloudinary').v2;

// 配置 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 预设的图片变换
const imageTransformations = {
  thumbnail: {
    width: 300,
    height: 200,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto'
  },
  medium: {
    width: 800,
    height: 600,
    crop: 'limit',
    quality: 'auto',
    fetch_format: 'auto'
  },
  large: {
    width: 1200,
    height: 800,
    crop: 'limit',
    quality: 'auto',
    fetch_format: 'auto'
  },
  avatar: {
    width: 150,
    height: 150,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    fetch_format: 'auto',
    radius: 'max'
  }
};

// 上传图片
const uploadImage = async (filePath, options = {}) => {
  try {
    const defaultOptions = {
      folder: 'motorcycles',
      resource_type: 'image',
      transformation: imageTransformations.large
    };

    const uploadOptions = { ...defaultOptions, ...options };
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    
    return {
      publicId: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes
    };
  } catch (error) {
    throw new Error(`图片上传失败: ${error.message}`);
  }
};

// 删除图片
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`图片删除失败: ${error.message}`);
  }
};

// 批量删除图片
const deleteImages = async (publicIds) => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    return result;
  } catch (error) {
    throw new Error(`批量删除图片失败: ${error.message}`);
  }
};

// 获取图片URL（带变换）
const getImageUrl = (publicId, transformation = 'medium') => {
  if (!publicId) return null;
  
  const transform = imageTransformations[transformation] || imageTransformations.medium;
  return cloudinary.url(publicId, transform);
};

// 生成多种尺寸的图片URL
const getImageUrls = (publicId) => {
  if (!publicId) return null;
  
  return {
    thumbnail: getImageUrl(publicId, 'thumbnail'),
    medium: getImageUrl(publicId, 'medium'),
    large: getImageUrl(publicId, 'large'),
    original: cloudinary.url(publicId)
  };
};

// 获取上传签名（用于前端直接上传）
const getUploadSignature = (folder = 'motorcycles') => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request({
    timestamp,
    folder,
    transformation: imageTransformations.large
  }, process.env.CLOUDINARY_API_SECRET);
  
  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder
  };
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage,
  deleteImages,
  getImageUrl,
  getImageUrls,
  getUploadSignature,
  imageTransformations
};