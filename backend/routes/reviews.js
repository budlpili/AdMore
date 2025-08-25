const express = require('express');
const router = express.Router();
const {
  getAllReviews,
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  updateReviewStatus,
  addAdminReply,
  updateAdminReply,
  deleteAdminReply
} = require('../controllers/reviewController');

// 모든 리뷰 조회
router.get('/', getAllReviews);

// 상품별 리뷰 조회
router.get('/product/:productId', getProductReviews);

// 리뷰 생성
router.post('/', createReview);

// 리뷰 수정
router.put('/:id', updateReview);

// 리뷰 삭제
router.delete('/:id', deleteReview);

// 리뷰 상태 변경
router.put('/:id/status', updateReviewStatus);

// 관리자 댓글 관련 엔드포인트
router.post('/:id/admin-reply', addAdminReply);
router.put('/:id/admin-reply', updateAdminReply);
router.delete('/:id/admin-reply', deleteAdminReply);

module.exports = router; 