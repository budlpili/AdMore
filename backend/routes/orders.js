const express = require('express');
const router = express.Router();
const { 
  createOrder, 
  getUserOrders, 
  getOrderById, 
  updateOrderStatus, 
  updateConfirmStatus,
  updateRequest,
  updatePaymentDate,
  updateReviewStatus,
  getAllOrders, 
  deleteOrder,
  getOrderStats
} = require('../controllers/orderController');
const auth = require('../middleware/auth');

// 주문 생성 (테스트용으로 인증 미들웨어 제거)
router.post('/', createOrder);

// 모든 주문 조회 (관리자용)
router.get('/', getAllOrders);

// 주문 통계 (관리자용)
router.get('/stats', getOrderStats);

// 사용자별 주문 목록 조회 (구체적인 경로를 먼저 정의)
router.get('/user/:userId', getUserOrders);

// 특정 주문 조회 (마지막에 정의)
router.get('/:id', getOrderById);

// 주문 상태 업데이트
router.put('/:id/status', updateOrderStatus);

// 구매확정 상태 업데이트
router.put('/:id/confirm', updateConfirmStatus);

// 요청사항 수정
router.put('/:id/request', updateRequest);

// 결제일 업데이트
router.put('/:id/payment', updatePaymentDate);

// 리뷰 상태 업데이트
router.put('/:id/review', updateReviewStatus);

// 주문 삭제
router.delete('/:id', deleteOrder);

module.exports = router; 