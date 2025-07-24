const express = require('express');
const router = express.Router();
const { 
  getAllProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  getPopularProducts,
  getProductsByCategory,
  updateProductStatus,
  getActiveProducts
} = require('../controllers/productController');
const { auth, adminAuth } = require('../middleware/auth');

// 모든 상품 조회
router.get('/', getAllProducts);

// 활성 상품만 조회
router.get('/active', getActiveProducts);

// 인기 상품 조회
router.get('/popular', getPopularProducts);

// 카테고리별 상품 조회
router.get('/category/:category', getProductsByCategory);

// 상품 상세 조회
router.get('/:id', getProductById);

// 상품 생성 (임시로 인증 제거)
router.post('/', createProduct);

// 상품 수정 (임시로 인증 제거)
router.put('/:id', updateProduct);

// 상품 상태 변경 (임시로 인증 제거)
router.patch('/:id/status', updateProductStatus);

// 상품 삭제 (임시로 인증 제거)
router.delete('/:id', deleteProduct);

module.exports = router; 