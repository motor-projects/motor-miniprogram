const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// 配置 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 本地存储配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/motorcycles';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 文件筛选
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件 (JPEG, PNG, GIF, WebP)'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

// 上传单个文件
router.post('/single', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }

    let result;
    
    // 如果配置了 Cloudinary，上传到云端
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'motorcycles',
        transformation: [
          { width: 1200, height: 800, crop: 'limit', quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      });
      
      // 删除本地临时文件
      fs.unlinkSync(req.file.path);
      
      res.json({
        message: '文件上传成功',
        url: result.secure_url,
        publicId: result.public_id
      });
    } else {
      // 本地存储
      const fileUrl = `/uploads/motorcycles/${req.file.filename}`;
      res.json({
        message: '文件上传成功',
        url: fileUrl,
        filename: req.file.filename
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: '文件上传失败', error: error.message });
  }
});

// 上传多个文件
router.post('/multiple', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: '没有上传文件' });
    }

    const uploadPromises = req.files.map(async (file) => {
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'motorcycles',
          transformation: [
            { width: 1200, height: 800, crop: 'limit', quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        });
        
        // 删除本地临时文件
        fs.unlinkSync(file.path);
        
        return {
          url: result.secure_url,
          publicId: result.public_id
        };
      } else {
        return {
          url: `/uploads/motorcycles/${file.filename}`,
          filename: file.filename
        };
      }
    });

    const results = await Promise.all(uploadPromises);
    
    res.json({
      message: '文件上传成功',
      files: results
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: '文件上传失败', error: error.message });
  }
});

// 删除文件
router.delete('/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;
    
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      await cloudinary.uploader.destroy(publicId);
    } else {
      // 本地文件删除
      const filePath = path.join(__dirname, '../../uploads/motorcycles', publicId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.json({ message: '文件删除成功' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: '文件删除失败', error: error.message });
  }
});

module.exports = router;