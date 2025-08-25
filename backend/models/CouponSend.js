const mongoose = require('mongoose');

const couponSendSchema = new mongoose.Schema({
  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['sent', 'used', 'expired'],
    default: 'sent'
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  usedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// 복합 인덱스: 사용자와 쿠폰 조합이 중복되지 않도록
couponSendSchema.index({ userId: 1, couponId: 1 }, { unique: true });

// 쿠폰 발송 이력 조회
couponSendSchema.statics.findByCouponId = function(couponId) {
  return this.find({ couponId }).populate('userId', 'name email');
};

// 사용자별 쿠폰 발송 이력 조회
couponSendSchema.statics.findByUserId = function(userId) {
  return this.find({ userId }).populate('couponId', 'name code discountType discountValue');
};

// 쿠폰 사용 상태 업데이트
couponSendSchema.statics.markAsUsed = function(sendId) {
  return this.findByIdAndUpdate(sendId, {
    status: 'used',
    usedAt: new Date()
  });
};

module.exports = mongoose.model('CouponSend', couponSendSchema);
