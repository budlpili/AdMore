const express = require('express');
const router = express.Router();
const {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getUserCoupons,
  sendCoupon,
  getCouponSends
} = require('../controllers/couponController');

// 쿠폰 목록 조회
router.get('/', getAllCoupons);

// 쿠폰 생성
router.post('/', createCoupon);

// 쿠폰 수정
router.put('/:id', updateCoupon);

// 쿠폰 삭제
router.delete('/:id', deleteCoupon);

// 사용자별 쿠폰 목록 조회
router.get('/user/:userId', getUserCoupons);

// 쿠폰 발송
router.post('/send', sendCoupon);

// 쿠폰 발송 이력 조회
router.get('/sends/:couponId', getCouponSends);

module.exports = router; 