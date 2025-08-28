const express = require('express');
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');
const {
  userRegistrationValidation,
  userLoginValidation,
  userProfileValidation,
  mongoIdValidation
} = require('../middleware/validation');
const {
  authLimiter,
  createAccountLimiter
} = require('../middleware/rateLimit');

const router = express.Router();

// 公开路由
router.post('/register', createAccountLimiter, userRegistrationValidation, authController.register);
router.post('/login', authLimiter, userLoginValidation, authController.login);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);
router.patch('/verify-email/:token', authController.verifyEmail);
router.post('/refresh-token', authController.refreshToken);

// 需要认证的路由
router.use(authenticate);

router.get('/me', authController.getMe);
router.post('/logout', authController.logout);
router.patch('/update-profile', userProfileValidation, authController.updateProfile);
router.patch('/update-password', authController.updatePassword);
router.post('/resend-verification', authController.resendVerificationEmail);

// 收藏相关路由
router.get('/favorites', authController.getFavorites);
router.post('/favorites/:motorcycleId', mongoIdValidation('motorcycleId'), authController.addToFavorites);
router.delete('/favorites/:motorcycleId', mongoIdValidation('motorcycleId'), authController.removeFromFavorites);

module.exports = router;