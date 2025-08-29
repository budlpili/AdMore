const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

// 로컬스토리지 주문 데이터를 MongoDB로 마이그레이션
router.post('/orders', async (req, res) => {
  try {
    const { orders } = req.body;
    
    if (!orders || !Array.isArray(orders)) {
      return res.status(400).json({ 
        success: false, 
        message: '주문 데이터가 올바르지 않습니다.' 
      });
    }

    console.log(`\n=== 로컬 주문 데이터 마이그레이션 시작 ===`);
    console.log(`총 ${orders.length}개의 주문을 마이그레이션합니다.`);

    let successCount = 0;
    let errorCount = 0;
    const results = [];

    for (const orderData of orders) {
      try {
        // 이미 존재하는 주문인지 확인
        const existingOrder = await Order.findOne({ orderId: orderData.id });
        if (existingOrder) {
          console.log(`주문 ${orderData.id}는 이미 존재합니다. 건너뜁니다.`);
          results.push({
            id: orderData.id,
            status: 'skipped',
            message: '이미 존재하는 주문'
          });
          continue;
        }

        // 주문 데이터 변환
        const transformedOrder = {
          orderId: orderData.id,
          productId: orderData.productId || orderData.product?._id || orderData.product?.id,
          product: orderData.product || orderData.productName,
          detail: orderData.detail || orderData.description || orderData.product?.description || '',
          quantity: orderData.quantity || 1,
          price: orderData.price || 0,
          originalPrice: orderData.originalPrice || orderData.price || 0,
          discountPrice: orderData.discountPrice || 0,
          request: orderData.request || orderData.requirements || '',
          paymentMethod: orderData.paymentMethod || 'card',
          paymentNumber: orderData.paymentNumber || '',
          userName: orderData.userName || orderData.user?.name || '',
          userEmail: orderData.userEmail || orderData.user?.email || '',
          status: orderData.status || '주문접수',
          createdAt: orderData.createdAt ? new Date(orderData.createdAt) : new Date(),
          updatedAt: orderData.updatedAt ? new Date(orderData.updatedAt) : new Date()
        };

        // 사용자 ID 찾기
        if (transformedOrder.userEmail) {
          try {
            const user = await User.findOne({ email: transformedOrder.userEmail });
            if (user) {
              transformedOrder.userId = user._id;
            }
          } catch (userError) {
            console.log(`사용자 ID 찾기 실패 (${transformedOrder.userEmail}):`, userError.message);
          }
        }

        // 주문 생성
        const newOrder = new Order(transformedOrder);
        await newOrder.save();
        
        console.log(`✅ 주문 ${orderData.id} 마이그레이션 성공`);
        results.push({
          id: orderData.id,
          status: 'success',
          message: '마이그레이션 성공'
        });
        successCount++;
        
      } catch (error) {
        console.error(`❌ 주문 ${orderData.id} 마이그레이션 실패:`, error.message);
        results.push({
          id: orderData.id,
          status: 'error',
          message: error.message
        });
        errorCount++;
      }
    }

    console.log(`\n=== 주문 마이그레이션 완료 ===`);
    console.log(`성공: ${successCount}개`);
    console.log(`실패: ${errorCount}개`);

    res.json({
      success: true,
      message: '주문 데이터 마이그레이션이 완료되었습니다.',
      summary: {
        total: orders.length,
        success: successCount,
        error: errorCount,
        skipped: orders.length - successCount - errorCount
      },
      results: results
    });

  } catch (error) {
    console.error('주문 마이그레이션 중 오류 발생:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 로컬스토리지 결제 데이터를 MongoDB로 마이그레이션
router.post('/payments', async (req, res) => {
  try {
    const { payments } = req.body;
    
    if (!payments || !Array.isArray(payments)) {
      return res.status(400).json({ 
        success: false, 
        message: '결제 데이터가 올바르지 않습니다.' 
      });
    }

    console.log(`\n=== 로컬 결제 데이터 마이그레이션 시작 ===`);
    console.log(`총 ${payments.length}개의 결제를 마이그레이션합니다.`);

    let successCount = 0;
    let errorCount = 0;
    const results = [];

    for (const paymentData of payments) {
      try {
        // 이미 존재하는 결제인지 확인 (orderId로)
        const existingOrder = await Order.findOne({ orderId: paymentData.orderId || paymentData.id });
        if (existingOrder) {
          console.log(`결제 ${paymentData.orderId || paymentData.id}는 이미 존재합니다. 건너뜁니다.`);
          results.push({
            id: paymentData.orderId || paymentData.id,
            status: 'skipped',
            message: '이미 존재하는 결제'
          });
          continue;
        }

        // 결제 데이터를 주문 데이터로 변환
        const transformedOrder = {
          orderId: paymentData.orderId || paymentData.id,
          productId: paymentData.productId || paymentData.product?._id || paymentData.product?.id,
          product: paymentData.product || paymentData.productName || '',
          detail: paymentData.detail || paymentData.description || '',
          quantity: paymentData.quantity || 1,
          price: paymentData.price || paymentData.amount || 0,
          originalPrice: paymentData.originalPrice || paymentData.price || paymentData.amount || 0,
          discountPrice: paymentData.discountPrice || 0,
          request: paymentData.request || paymentData.requirements || '',
          paymentMethod: paymentData.paymentMethod || paymentData.method || 'card',
          paymentNumber: paymentData.paymentNumber || paymentData.transactionId || '',
          userName: paymentData.userName || paymentData.user?.name || '',
          userEmail: paymentData.userEmail || paymentData.user?.email || '',
          status: paymentData.status || '결제완료',
          createdAt: paymentData.createdAt ? new Date(paymentData.createdAt) : new Date(),
          updatedAt: paymentData.updatedAt ? new Date(paymentData.updatedAt) : new Date()
        };

        // 사용자 ID 찾기
        if (transformedOrder.userEmail) {
          try {
            const user = await User.findOne({ email: transformedOrder.userEmail });
            if (user) {
              transformedOrder.userId = user._id;
            }
          } catch (userError) {
            console.log(`사용자 ID 찾기 실패 (${transformedOrder.userEmail}):`, userError.message);
          }
        }

        // 주문 생성
        const newOrder = new Order(transformedOrder);
        await newOrder.save();
        
        console.log(`✅ 결제 ${paymentData.orderId || paymentData.id} 마이그레이션 성공`);
        results.push({
          id: paymentData.orderId || paymentData.id,
          status: 'success',
          message: '마이그레이션 성공'
        });
        successCount++;
        
      } catch (error) {
        console.error(`❌ 결제 ${paymentData.orderId || paymentData.id} 마이그레이션 실패:`, error.message);
        results.push({
          id: paymentData.orderId || paymentData.id,
          status: 'error',
          message: error.message
        });
        errorCount++;
      }
    }

    console.log(`\n=== 결제 마이그레이션 완료 ===`);
    console.log(`성공: ${successCount}개`);
    console.log(`실패: ${errorCount}개`);

    res.json({
      success: true,
      message: '결제 데이터 마이그레이션이 완료되었습니다.',
      summary: {
        total: payments.length,
        success: successCount,
        error: errorCount,
        skipped: payments.length - successCount - errorCount
      },
      results: results
    });

  } catch (error) {
    console.error('결제 마이그레이션 중 오류 발생:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 마이그레이션 상태 확인
router.get('/status', async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderId product userName userEmail status createdAt');

    res.json({
      success: true,
      data: {
        totalOrders,
        recentOrders
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '상태 확인 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router;





