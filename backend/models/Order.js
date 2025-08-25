const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  product: {
    type: String,
    required: true,
    trim: true
  },
  detail: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  discountPrice: {
    type: Number,
    min: 0
  },
  request: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'virtual_account', 'transfer', 'virtual'],
    required: true
  },
  paymentNumber: {
    type: String,
    trim: true
  },
  userName: {
    type: String,
    required: true,
    trim: true
  },
  userEmail: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['대기중', '처리중', '완료', '취소', '주문접수', '확인대기', '결제완료', '작업완료', '구매완료'],
    default: '주문접수'
  },
  confirmStatus: {
    type: String,
    enum: ['구매확정전', '구매확정'],
    default: '구매확정전'
  },
  paymentDate: {
    type: String,
    default: '-'
  },
  review: {
    type: String,
    enum: ['리뷰 작성하기', '리뷰확인', '리뷰보러가기'],
    default: '리뷰 작성하기'
  },
  productNumber: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// 주문번호로 검색
orderSchema.statics.findByOrderId = function(orderId) {
  return this.findOne({ orderId });
};

// 사용자별 주문 조회
orderSchema.statics.findByUserId = function(userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

// 상태별 주문 조회
orderSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Order', orderSchema);
