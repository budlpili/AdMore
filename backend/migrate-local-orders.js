const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// MongoDB 연결 설정
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/admore';

// MongoDB 모델들
const Order = require('./models/Order');
const User = require('./models/User');
const Product = require('./models/Product');

// 로컬스토리지 데이터 구조 (프론트엔드에서 사용하는 구조)
const LOCAL_STORAGE_KEYS = {
  ORDERS: 'paymentList',
  USERS: 'user',
  PRODUCTS: 'recentProducts'
};

// 로컬스토리지 데이터를 시뮬레이션하는 함수
function getLocalStorageData() {
  // 실제로는 프론트엔드의 로컬스토리지에서 가져와야 하지만,
  // 여기서는 백엔드에서 접근할 수 있는 데이터를 사용
  console.log('로컬스토리지 데이터 시뮬레이션...');
  
  // 예시 데이터 구조 (실제 데이터는 프론트엔드에서 확인 필요)
  const sampleOrders = [
    {
      id: 'ORDER-1755594625896',
      productId: '689daa1ec7448e381339174f',
      product: '페이스북 좋아요 2000개',
      price: 200000,
      originalPrice: 200000,
      discountPrice: 0,
      quantity: 7,
      paymentMethod: 'card',
      request: '몽고몽고',
      detail: '페이지/게시물 좋아요 빠른 증가!',
      userName: '테스트 사용자',
      userEmail: 'test@example.com',
      status: '주문접수',
      createdAt: new Date('2025-08-20T12:10:00'),
      updatedAt: new Date('2025-08-20T12:10:00')
    },
    {
      id: 'ORDER-1755594318782',
      productId: '689daa1ec7448e381339174f',
      product: '페이스북 좋아요 2000개',
      price: 50000,
      originalPrice: 50000,
      discountPrice: 0,
      quantity: 1,
      paymentMethod: 'card',
      request: '몽고디비테스트중입니다.',
      detail: '페이지/게시물 좋아요 빠른 증가!',
      userName: '테스트 사용자',
      userEmail: 'test@example.com',
      status: '주문접수',
      createdAt: new Date('2025-08-20T12:05:00'),
      updatedAt: new Date('2025-08-20T12:05:00')
    },
    {
      id: 'ORDER-1755594263655',
      productId: '689daa1ec7448e381339174f',
      product: '페이스북 팔로워 1000명',
      price: 90000,
      originalPrice: 90000,
      discountPrice: 0,
      quantity: 1,
      paymentMethod: 'card',
      request: '요구사항입니다.',
      detail: '진짜 팔로워로 페이지 신뢰도 상승!',
      userName: '테스트 사용자',
      userEmail: 'test@example.com',
      status: '주문접수',
      createdAt: new Date('2025-08-20T12:04:00'),
      updatedAt: new Date('2025-08-20T12:04:00')
    }
  ];

  return {
    orders: sampleOrders,
    users: [],
    products: []
  };
}

// 주문 데이터를 MongoDB 형식으로 변환
function transformOrderData(orderData) {
  return {
    orderId: orderData.id,
    productId: orderData.productId,
    product: orderData.product,
    detail: orderData.detail,
    quantity: orderData.quantity,
    price: orderData.price,
    originalPrice: orderData.originalPrice,
    discountPrice: orderData.discountPrice,
    request: orderData.request,
    paymentMethod: orderData.paymentMethod,
    paymentNumber: '',
    userName: orderData.userName,
    userEmail: orderData.userEmail,
    status: orderData.status || '주문접수',
    createdAt: orderData.createdAt || new Date(),
    updatedAt: orderData.updatedAt || new Date()
  };
}

// 사용자 ID 찾기 (이메일로)
async function findUserIdByEmail(email) {
  try {
    const user = await User.findOne({ email: email });
    return user ? user._id : null;
  } catch (error) {
    console.log(`사용자 ID 찾기 실패 (${email}):`, error.message);
    return null;
  }
}

// 주문 데이터를 MongoDB에 저장
async function migrateOrders(orders) {
  console.log(`\n=== 주문 데이터 마이그레이션 시작 ===`);
  console.log(`총 ${orders.length}개의 주문을 마이그레이션합니다.`);

  let successCount = 0;
  let errorCount = 0;

  for (const orderData of orders) {
    try {
      // 이미 존재하는 주문인지 확인
      const existingOrder = await Order.findOne({ orderId: orderData.id });
      if (existingOrder) {
        console.log(`주문 ${orderData.id}는 이미 존재합니다. 건너뜁니다.`);
        continue;
      }

      // 주문 데이터 변환
      const transformedOrder = transformOrderData(orderData);
      
      // 사용자 ID 찾기
      if (transformedOrder.userEmail) {
        const userId = await findUserIdByEmail(transformedOrder.userEmail);
        if (userId) {
          transformedOrder.userId = userId;
        }
      }

      // 주문 생성
      const newOrder = new Order(transformedOrder);
      await newOrder.save();
      
      console.log(`✅ 주문 ${orderData.id} 마이그레이션 성공`);
      successCount++;
      
    } catch (error) {
      console.error(`❌ 주문 ${orderData.id} 마이그레이션 실패:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n=== 주문 마이그레이션 완료 ===`);
  console.log(`성공: ${successCount}개`);
  console.log(`실패: ${errorCount}개`);
  
  return { successCount, errorCount };
}

// 마이그레이션 실행
async function runMigration() {
  try {
    console.log('MongoDB에 연결 중...');
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB 연결 성공!');

    // 로컬스토리지 데이터 가져오기
    const localData = getLocalStorageData();
    
    if (!localData.orders || localData.orders.length === 0) {
      console.log('마이그레이션할 주문 데이터가 없습니다.');
      return;
    }

    // 주문 데이터 마이그레이션
    await migrateOrders(localData.orders);

    console.log('\n🎉 로컬 주문내역 마이그레이션이 완료되었습니다!');
    
  } catch (error) {
    console.error('마이그레이션 중 오류 발생:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB 연결 종료');
  }
}

// 스크립트 실행
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };



