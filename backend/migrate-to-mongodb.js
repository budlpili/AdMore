const sqlite3 = require('sqlite3').verbose();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Category = require('./models/Category');
const Tag = require('./models/Tag');
const Coupon = require('./models/Coupon');
const Order = require('./models/Order');
const Review = require('./models/Review');
require('dotenv').config();

// MongoDB 연결
const connectMongoDB = require('./config/mongodb');

// SQLite 데이터베이스 연결
const db = new sqlite3.Database('./admore.db');

async function migrateData() {
  try {
    console.log('MongoDB 연결 중...');
    await connectMongoDB();
    console.log('MongoDB 연결 성공!');

    // 1. 사용자 데이터 마이그레이션
    console.log('\n=== 사용자 데이터 마이그레이션 시작 ===');
    const users = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM users", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const user of users) {
      try {
        const userData = {
          name: user.name,
          email: user.email,
          password: user.password,
          phone: user.phone,
          address: user.address,
          role: user.role || 'user',
          emailVerified: user.emailVerified || 0,
          status: user.status || 'active',
          createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
          updatedAt: new Date()
        };

        // 기존 사용자 확인
        const existingUser = await User.findOne({ email: user.email });
        if (!existingUser) {
          const newUser = new User(userData);
          await newUser.save();
          console.log(`✅ 사용자 마이그레이션 완료: ${user.name} (${user.email})`);
        } else {
          console.log(`⚠️ 사용자 이미 존재: ${user.name} (${user.email})`);
        }
      } catch (error) {
        console.error(`❌ 사용자 마이그레이션 실패: ${user.name}`, error.message);
      }
    }

    // 2. 상품 데이터 마이그레이션
    console.log('\n=== 상품 데이터 마이그레이션 시작 ===');
    const products = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM products", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const product of products) {
      try {
        const productData = {
          name: product.name,
          description: product.description,
          detailedDescription: product.detailedDescription || product.description || '',
          price: product.price,
          price1Day: product.price1Day || product.price,
          price7Days: product.price7Days || product.price * 7,
          price30Days: product.price30Days || product.price * 30,
          category: product.category || '기타',
          tags: product.tags ? product.tags.split(',').map(tag => tag.trim()) : [],
          image: product.image,
          background: product.background || '',
          status: product.status || 'active',
          productNumber: `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: product.createdAt ? new Date(product.createdAt) : new Date(),
          updatedAt: new Date()
        };

        // 기존 상품 확인
        const existingProduct = await Product.findOne({ name: product.name });
        if (!existingProduct) {
          const newProduct = new Product(productData);
          await newProduct.save();
          console.log(`✅ 상품 마이그레이션 완료: ${product.name}`);
        } else {
          console.log(`⚠️ 상품 이미 존재: ${product.name}`);
        }
      } catch (error) {
        console.error(`❌ 상품 마이그레이션 실패: ${product.name}`, error.message);
      }
    }

    // 3. 카테고리 데이터 마이그레이션
    console.log('\n=== 카테고리 데이터 마이그레이션 시작 ===');
    const categories = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM categories", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const category of categories) {
      try {
        const categoryData = {
          name: category.name,
          type: category.type || 'custom',
          createdAt: category.createdAt ? new Date(category.createdAt) : new Date(),
          updatedAt: new Date()
        };

        // 기존 카테고리 확인
        const existingCategory = await Category.findOne({ name: category.name });
        if (!existingCategory) {
          const newCategory = new Category(categoryData);
          await newCategory.save();
          console.log(`✅ 카테고리 마이그레이션 완료: ${category.name}`);
        } else {
          console.log(`⚠️ 카테고리 이미 존재: ${category.name}`);
        }
      } catch (error) {
        console.error(`❌ 카테고리 마이그레이션 실패: ${category.name}`, error.message);
      }
    }

    // 4. 태그 데이터 마이그레이션
    console.log('\n=== 태그 데이터 마이그레이션 시작 ===');
    const tags = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM tags", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const tag of tags) {
      try {
        const tagData = {
          name: tag.name,
          createdAt: tag.createdAt ? new Date(tag.createdAt) : new Date(),
          updatedAt: new Date()
        };

        // 기존 태그 확인
        const existingTag = await Tag.findOne({ name: tag.name });
        if (!existingTag) {
          const newTag = new Tag(tagData);
          await newTag.save();
          console.log(`✅ 태그 마이그레이션 완료: ${tag.name}`);
        } else {
          console.log(`⚠️ 태그 이미 존재: ${tag.name}`);
        }
      } catch (error) {
        console.error(`❌ 태그 마이그레이션 실패: ${tag.name}`, error.message);
      }
    }

    // 5. 쿠폰 데이터 마이그레이션
    console.log('\n=== 쿠폰 데이터 마이그레이션 시작 ===');
    const coupons = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM coupons", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const coupon of coupons) {
      try {
        const couponData = {
          code: coupon.code || `COUPON-${Date.now()}`,
          name: coupon.name || '쿠폰',
          discountType: coupon.discountType || 'percentage',
          discountValue: coupon.discountValue || 0,
          minAmount: coupon.minAmount || 0,
          maxDiscount: coupon.maxDiscount || 0,
          validFrom: coupon.validFrom ? new Date(coupon.validFrom) : new Date(),
          validTo: coupon.validTo ? new Date(coupon.validTo) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          usageLimit: coupon.usageLimit || 100,
          usedCount: coupon.usedCount || 0,
          status: coupon.status || 'active',
          createdAt: coupon.createdAt ? new Date(coupon.createdAt) : new Date(),
          updatedAt: new Date()
        };

        // 기존 쿠폰 확인
        const existingCoupon = await Coupon.findOne({ code: couponData.code });
        if (!existingCoupon) {
          const newCoupon = new Coupon(couponData);
          await newCoupon.save();
          console.log(`✅ 쿠폰 마이그레이션 완료: ${couponData.name}`);
        } else {
          console.log(`⚠️ 쿠폰 이미 존재: ${couponData.name}`);
        }
      } catch (error) {
        console.error(`❌ 쿠폰 마이그레이션 실패: ${coupon.name || '알 수 없음'}`, error.message);
      }
    }

    // 6. 주문 데이터 마이그레이션
    console.log('\n=== 주문 데이터 마이그레이션 시작 ===');
    const orders = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM orders", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const order of orders) {
      try {
        const orderData = {
          orderId: order.orderId || `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: order.userId,
          products: order.products ? JSON.parse(order.products) : [],
          totalAmount: order.totalAmount || 0,
          status: order.status || 'pending',
          paymentMethod: order.paymentMethod || 'card',
          shippingAddress: order.shippingAddress || '',
          createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
          updatedAt: new Date()
        };

        // 기존 주문 확인
        const existingOrder = await Order.findOne({ orderId: orderData.orderId });
        if (!existingOrder) {
          const newOrder = new Order(orderData);
          await newOrder.save();
          console.log(`✅ 주문 마이그레이션 완료: ${orderData.orderId}`);
        } else {
          console.log(`⚠️ 주문 이미 존재: ${orderData.orderId}`);
        }
      } catch (error) {
        console.error(`❌ 주문 마이그레이션 실패: ${order.id}`, error.message);
      }
    }

    // 7. 리뷰 데이터 마이그레이션
    console.log('\n=== 리뷰 데이터 마이그레이션 시작 ===');
    const reviews = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM reviews", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const review of reviews) {
      try {
        const reviewData = {
          productId: review.productId,
          userId: review.userId,
          rating: review.rating || 5,
          comment: review.comment || '',
          status: review.status || 'approved',
          createdAt: review.createdAt ? new Date(review.createdAt) : new Date(),
          updatedAt: new Date()
        };

        // 기존 리뷰 확인
        const existingReview = await Review.findOne({ 
          productId: review.productId, 
          userId: review.userId 
        });
        if (!existingReview) {
          const newReview = new Review(reviewData);
          await newReview.save();
          console.log(`✅ 리뷰 마이그레이션 완료: ${review.id}`);
        } else {
          console.log(`⚠️ 리뷰 이미 존재: ${review.id}`);
        }
      } catch (error) {
        console.error(`❌ 리뷰 마이그레이션 실패: ${review.id}`, error.message);
      }
    }

    console.log('\n🎉 마이그레이션 완료!');
    console.log(`- 사용자: ${users.length}명`);
    console.log(`- 상품: ${products.length}개`);
    console.log(`- 카테고리: ${categories.length}개`);
    console.log(`- 태그: ${tags.length}개`);
    console.log(`- 쿠폰: ${coupons.length}개`);
    console.log(`- 주문: ${orders.length}개`);
    console.log(`- 리뷰: ${reviews.length}개`);

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
  } finally {
    db.close();
    mongoose.connection.close();
    console.log('데이터베이스 연결 종료');
  }
}

// 마이그레이션 실행
migrateData();
