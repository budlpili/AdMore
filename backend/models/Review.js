const mongoose = require('mongoose');

// 기존 캐시된 모델 제거
if (mongoose.models.Review) {
  delete mongoose.models.Review;
}

const reviewSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  productId: {
    type: String,
    required: true
  },
  product: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  adminReply: {
    type: String,
    default: null
  },
  adminReplyTime: {
    type: Date,
    default: null
  },
  adminEmail: {
    type: String,
    default: null
  },
  // 상품 이미지 필드 추가
  productImage: {
    type: String,
    default: null
  },
  // 주문 정보 필드 추가
  orderId: {
    type: String,
    default: null
  },
  orderDate: {
    type: Date,
    default: null
  },
  quantity: {
    type: Number,
    default: null
  }
});

module.exports = mongoose.model('Review', reviewSchema);