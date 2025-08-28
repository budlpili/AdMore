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

async function fixMigration() {
  try {
    console.log('MongoDB 연결 중...');
    await connectMongoDB();
    console.log('MongoDB 연결 성공!');

    // ID 매핑 테이블 생성
    const idMapping = {
      users: {},
      products: {},
      categories: {},
      tags: {}
    };

    // 1. 사용자 ID 매핑
    console.log('\n=== 사용자 ID 매핑 생성 ===');
    const users = await User.find();
    for (const user of users) {
      // SQLite에서 해당 사용자 찾기
      const sqliteUser = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM users WHERE email = ?", [user.email], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      if (sqliteUser) {
        idMapping.users[sqliteUser.id] = user._id.toString();
        console.log(`사용자 ID 매핑: ${sqliteUser.id} -> ${user._id}`);
      }
    }

    // 2. 상품 ID 매핑
    console.log('\n=== 상품 ID 매핑 생성 ===');
    const products = await Product.find();
    for (const product of products) {
      // SQLite에서 해당 상품 찾기
      const sqliteProduct = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM products WHERE name = ?", [product.name], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      if (sqliteProduct) {
        idMapping.products[sqliteProduct.id] = product._id.toString();
        console.log(`상품 ID 매핑: ${sqliteProduct.id} -> ${product._id}`);
      }
    }

    // 3. 카테고리 ID 매핑
    console.log('\n=== 카테고리 ID 매핑 생성 ===');
    const categories = await Category.find();
    for (const category of categories) {
      // SQLite에서 해당 카테고리 찾기
      const sqliteCategory = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM categories WHERE name = ?", [category.name], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      if (sqliteCategory) {
        idMapping.categories[sqliteCategory.id] = category._id.toString();
        console.log(`카테고리 ID 매핑: ${sqliteCategory.id} -> ${category._id}`);
      }
    }

    // 4. 태그 ID 매핑
    console.log('\n=== 태그 ID 매핑 생성 ===');
    const tags = await Tag.find();
    for (const tag of tags) {
      // SQLite에서 해당 태그 찾기
      const sqliteTag = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM tags WHERE name = ?", [tag.name], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      if (sqliteTag) {
        idMapping.tags[sqliteTag.id] = tag._id.toString();
        console.log(`태그 ID 매핑: ${sqliteTag.id} -> ${tag._id}`);
      }
    }

    console.log('\n=== ID 매핑 완료 ===');
    console.log('ID 매핑 테이블:', JSON.stringify(idMapping, null, 2));

    // 5. 주문 데이터 수정된 마이그레이션
    console.log('\n=== 주문 데이터 마이그레이션 (수정) ===');
    const orders = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM orders", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const order of orders) {
      try {
        // 사용자 ID 변환
        const userId = idMapping.users[order.userId];
        if (!userId) {
          console.log(`⚠️ 사용자 ID를 찾을 수 없음: ${order.userId}`);
          continue;
        }

        // 상품 정보 파싱
        let products = [];
        let totalAmount = 0;
        if (order.products) {
          try {
            const productData = JSON.parse(order.products);
            products = productData.map(p => ({
              productId: idMapping.products[p.productId] || p.productId,
              name: p.name,
              price: p.price,
              quantity: p.quantity || 1
            }));
            totalAmount = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
          } catch (e) {
            console.log(`⚠️ 상품 데이터 파싱 실패: ${order.id}`);
          }
        }

        // 상태 변환
        let status = 'pending';
        if (order.status === '작업완료') status = 'completed';
        else if (order.status === '진행 중') status = 'processing';
        else if (order.status === '리뷰확인') status = 'reviewed';
        else if (order.status === '작업취소') status = 'cancelled';

        // 결제 방법 변환
        let paymentMethod = 'card';
        if (order.paymentMethod === 'virtual') paymentMethod = 'virtual';

        const orderData = {
          orderId: order.orderId || `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: userId,
          userEmail: order.userEmail || 'unknown@example.com',
          userName: order.userName || 'Unknown User',
          products: products,
          productId: products.length > 0 ? products[0].productId : null,
          price: totalAmount,
          totalAmount: totalAmount,
          status: status,
          paymentMethod: paymentMethod,
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

    // 6. 리뷰 데이터 수정된 마이그레이션
    console.log('\n=== 리뷰 데이터 마이그레이션 (수정) ===');
    const reviews = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM reviews", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const review of reviews) {
      try {
        // 상품 ID 변환
        const productId = idMapping.products[review.productId];
        if (!productId) {
          console.log(`⚠️ 상품 ID를 찾을 수 없음: ${review.productId}`);
          continue;
        }

        // 사용자 ID 변환
        const userId = idMapping.users[review.userId];
        if (!userId) {
          console.log(`⚠️ 사용자 ID를 찾을 수 없음: ${review.userId}`);
          continue;
        }

        const reviewData = {
          productId: productId,
          userId: userId,
          rating: review.rating || 5,
          comment: review.comment || '',
          status: review.status || 'approved',
          createdAt: review.createdAt ? new Date(review.createdAt) : new Date(),
          updatedAt: new Date()
        };

        // 기존 리뷰 확인
        const existingReview = await Review.findOne({ 
          productId: reviewData.productId, 
          userId: reviewData.userId 
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

    console.log('\n🎉 마이그레이션 수정 완료!');

  } catch (error) {
    console.error('❌ 마이그레이션 수정 실패:', error);
  } finally {
    db.close();
    mongoose.connection.close();
    console.log('데이터베이스 연결 종료');
  }
}

// 마이그레이션 수정 실행
fixMigration();




