const express = require('express');
const reviewController = require('../controllers/reviewController');
const { authenticate, authorize, checkOwnership } = require('../middleware/auth');
const {
  reviewValidation,
  mongoIdValidation,
  paginationValidation
} = require('../middleware/validation');
const { reviewLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// 公开路由
router.get('/motorcycle/:motorcycleId', 
  mongoIdValidation('motorcycleId'),
  paginationValidation,
  reviewController.getMotorcycleReviews
);

router.get('/:id', 
  mongoIdValidation('id'),
  reviewController.getReviewById
);

// 需要认证的路由
router.use(authenticate);

// 用户评价相关
router.get('/', 
  paginationValidation,
  reviewController.getUserReviews
);

router.post('/motorcycle/:motorcycleId',
  mongoIdValidation('motorcycleId'),
  reviewLimiter,
  reviewValidation,
  reviewController.createReview
);

router.patch('/:id',
  mongoIdValidation('id'),
  reviewValidation,
  reviewController.updateReview
);

router.delete('/:id',
  mongoIdValidation('id'),
  reviewController.deleteReview
);

// 评价互动
router.patch('/:id/helpful',
  mongoIdValidation('id'),
  reviewController.markHelpful
);

router.post('/:id/reply',
  mongoIdValidation('id'),
  reviewController.replyToReview
);

// 管理员路由
router.use(authorize('admin', 'moderator'));

router.get('/admin/pending',
  paginationValidation,
  reviewController.getPendingReviews
);

router.patch('/:id/moderate',
  mongoIdValidation('id'),
  reviewController.moderateReview
);

router.patch('/:id/featured',
  mongoIdValidation('id'),
  reviewController.toggleFeatured
);

module.exports = router;