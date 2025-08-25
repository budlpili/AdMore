const mongoose = require('mongoose');
const Review = require('./models/Review');
const Product = require('./models/Product');

async function migrateProductImages() {
  try {
    // MongoDB 연결
    await mongoose.connect('mongodb://localhost:27017/admore');
    console.log('MongoDB 연결 성공');

    // 모든 리뷰 조회
    const reviews = await Review.find();
    console.log(`총 ${reviews.length}개의 리뷰를 찾았습니다.`);

    let updatedCount = 0;

    for (const review of reviews) {
      try {
        // 상품 ID로 상품 조회
        let product = null;
        
        // productId가 ObjectId인 경우
        if (mongoose.Types.ObjectId.isValid(review.productId)) {
          product = await Product.findById(review.productId);
        }
        
        // productId가 문자열인 경우 (상품명으로 검색)
        if (!product && review.product) {
          product = await Product.findOne({ name: review.product });
        }

        if (product) {
          // 상품 이미지 업데이트
          if (product.image) {
            await Review.findByIdAndUpdate(review._id, {
              productImage: product.image
            });
            console.log(`리뷰 ${review._id}에 상품 이미지 추가: ${product.name}`);
            updatedCount++;
          }
        } else {
          console.log(`상품을 찾을 수 없음: ${review.productId} / ${review.product}`);
        }
      } catch (error) {
        console.error(`리뷰 ${review._id} 처리 중 오류:`, error);
      }
    }

    console.log(`총 ${updatedCount}개의 리뷰가 업데이트되었습니다.`);
    
  } catch (error) {
    console.error('마이그레이션 오류:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB 연결 해제');
  }
}

migrateProductImages();
