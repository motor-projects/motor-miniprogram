const express = require('express');
const motorcycleController = require('../controllers/motorcycleController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const {
  motorcycleValidation,
  mongoIdValidation,
  paginationValidation,
  searchValidation
} = require('../middleware/validation');
const { adminLimiter, searchLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// 公开路由
router.get('/', 
  paginationValidation,
  searchValidation,
  searchLimiter,
  optionalAuth,
  motorcycleController.getAllMotorcycles
);

router.get('/stats', motorcycleController.getStatistics);

router.get('/search',
  searchValidation,
  searchLimiter,
  motorcycleController.searchMotorcycles
);

router.get('/filters',
  motorcycleController.getAvailableFilters
);

router.get('/brands',
  motorcycleController.getBrands
);

router.get('/categories',
  motorcycleController.getCategories
);

router.get('/compare',
  motorcycleController.compareMotorcycles
);

router.get('/slug/:slug', 
  optionalAuth,
  motorcycleController.getMotorcycleBySlug
);

router.get('/:id', 
  mongoIdValidation('id'),
  optionalAuth,
  motorcycleController.getMotorcycleById
);

// 需要认证的路由
router.use(authenticate);

// 数据导入导出（管理员）
router.post('/import',
  authorize('admin'),
  adminLimiter,
  motorcycleController.importData
);

router.get('/export',
  authorize('admin'),
  adminLimiter,
  motorcycleController.exportData
);

// CRUD操作（管理员/版主）
router.post('/', 
  authorize('admin', 'moderator'),
  adminLimiter,
  motorcycleValidation,
  motorcycleController.createMotorcycle
);

router.put('/:id', 
  mongoIdValidation('id'),
  authorize('admin', 'moderator'),
  adminLimiter,
  motorcycleValidation,
  motorcycleController.updateMotorcycle
);

router.delete('/:id', 
  mongoIdValidation('id'),
  authorize('admin'),
  adminLimiter,
  motorcycleController.deleteMotorcycle
);

// 批量操作（管理员）
router.patch('/batch/update',
  authorize('admin'),
  adminLimiter,
  motorcycleController.batchUpdate
);

router.delete('/batch/delete',
  authorize('admin'),
  adminLimiter,
  motorcycleController.batchDelete
);

module.exports = router;