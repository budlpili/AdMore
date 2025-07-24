const express = require('express');
const router = express.Router();
const { 
  createOrder, 
  getUserOrders, 
  getOrderById, 
  updateOrderStatus, 
  updateOrderStatusByOrderId,
  confirmPurchase, 
  getAllOrders, 
  deleteOrder,
  updateExistingCardPayments 
} = require('../controllers/orderController');
const auth = require('../middleware/auth');

// 주문 생성 (테스트용으로 인증 미들웨어 제거)
router.post('/', createOrder);

// 사용자 주문 목록 조회 (테스트용으로 인증 미들웨어 제거)
router.get('/user', getUserOrders);

// 모든 주문 조회 (관리자용)
router.get('/', getAllOrders);

// 주문 상태 업데이트 (orderId로) - 이 라우트가 :id 라우트보다 먼저 와야 함
router.put('/order/:orderId/status', updateOrderStatusByOrderId);

// 특정 주문 조회
router.get('/:id', getOrderById);

// 주문 상태 업데이트 (id로)
router.put('/:id/status', updateOrderStatus);

// 구매 확정
router.put('/:id/confirm', confirmPurchase);

// 주문 삭제 (테스트용)
router.delete('/:id', deleteOrder);

// 기존 신용카드 주문들의 결제일 업데이트 (테스트용)
router.put('/update-card-payments', updateExistingCardPayments);

module.exports = router; 