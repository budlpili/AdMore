const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  detailedDescription: {
    type: String,
    trim: true
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
  price1Day: {
    type: Number,
    min: 0
  },
  price7Days: {
    type: Number,
    min: 0
  },
  price30Days: {
    type: Number,
    min: 0
  },
  discountRate: {
    type: Number,
    min: 0,
    max: 100
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  },
  tags: [{
    type: String,
    trim: true
  }],
  specifications: {
    type: Map,
    of: String
  },
  image: {
    type: String
  },
  background: {
    type: String
  },
  productNumber: {
    type: String,
    unique: true,
    trim: true,
    default: function() {
      return 'PROD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  // 상품 개시 예정일 (이 날짜 전에는 "준비중" 표시 용도)
  startDate: {
    type: Date
  }
}, {
  timestamps: true
});

// 상품명으로 검색
productSchema.statics.findByName = function(name) {
  return this.find({ 
    name: { $regex: name, $options: 'i' },
    status: 'active'
  });
};

// 카테고리별 상품 조회
productSchema.statics.findByCategory = function(category) {
  return this.find({ 
    category: category,
    status: 'active'
  }).sort({ createdAt: -1 });
};

// 활성 상품만 조회
productSchema.statics.findActive = function() {
  return this.find({ status: 'active' }).sort({ createdAt: -1 });
};

// 상품번호로 상품 찾기
productSchema.statics.findByProductNumber = function(productNumber) {
  return this.findOne({ productNumber: productNumber });
};

// 재고 업데이트
productSchema.statics.updateStock = function(productId, quantity) {
  return this.findByIdAndUpdate(productId, {
    $inc: { stock: -quantity }
  });
};

// 평점 업데이트
productSchema.statics.updateRating = function(productId, newRating, reviewCount) {
  return this.findByIdAndUpdate(productId, {
    rating: newRating,
    reviewCount: reviewCount
  });
};

module.exports = mongoose.model('Product', productSchema);
