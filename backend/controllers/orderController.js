const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// 주문번호 생성 함수
const generateOrderId = () => {
  const today = new Date();
  const dateStr = today.getFullYear().toString() + 
                 String(today.getMonth() + 1).padStart(2, '0') + 
                 String(today.getDate()).padStart(2, '0');
  
  // 현재 시간을 포함한 고유 ID 생성
  const timeStr = String(today.getHours()).padStart(2, '0') + 
                  String(today.getMinutes()).padStart(2, '0') + 
                  String(today.getSeconds()).padStart(2, '0');
  
  return `${dateStr}-${timeStr}`;
};

// 주문 생성
const createOrder = async (req, res) => {
  try {
    // 사용자 이메일로 사용자 ID 찾기
    let userId = '507f1f77bcf86cd799439011'; // 기본 ObjectId
    
    if (req.body.userEmail) {
      try {
        const user = await User.findOne({ email: req.body.userEmail });
        if (user) {
          userId = user._id;
        }
      } catch (userError) {
        console.log('사용자 ID 찾기 실패, 기본값 사용:', userError);
      }
    }
    const {
      productId,
      product,
      detail,
      quantity,
      price,
      originalPrice,
      discountPrice,
      request,
      paymentMethod,
      paymentNumber,
      userName,
      userEmail
    } = req.body;

    console.log('받은 주문 데이터:', req.body);

    if (!productId || !price) {
      return res.status(400).json({ message: '필수 필드가 누락되었습니다.' });
    }

    // 먼저 상품 정보를 데이터베이스에서 가져오기
    const productData = await Product.findById(productId);
    if (!productData) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    // 실제 상품 정보 사용
    const actualProductName = productData.name;
    const actualProductDescription = productData.description || productData.name;
    const actualProductNumber = productData.productNumber || `P${productId.toString().padStart(3, '0')}`;

    const orderId = generateOrderId();
    const currentDate = new Date();
    
    // 신용카드 결제의 경우 결제일을 현재 시간으로 설정, 가상계좌는 '-'
    const paymentDate = paymentMethod === 'card' ? currentDate.toISOString().slice(0, 19).replace('T', ' ') : '-';
    
    // 주문 생성
    const order = new Order({
      orderId,
      userId,
      productId,
      product: actualProductName,
      detail: actualProductDescription,
      quantity: quantity || 1,
      price,
      originalPrice,
      discountPrice,
      request,
      date: currentDate,
      paymentMethod,
      paymentNumber,
      userName,
      userEmail,
      status: '대기중',
      confirmStatus: '구매확정전',
      paymentDate,
      productNumber: actualProductNumber
    });

    await order.save();

    res.status(201).json({
      message: '주문이 성공적으로 생성되었습니다.',
      orderId: orderId,
      order: {
        id: order._id,
        orderId: orderId,
        productId: productId,
        product: actualProductName,
        detail: actualProductDescription,
        quantity: quantity || 1,
        price: price,
        status: '대기중',
        confirmStatus: '구매확정전',
        date: currentDate,
        paymentDate: paymentDate
      }
    });
  } catch (error) {
    console.error('주문 생성 오류:', error);
    res.status(500).json({ message: '주문 생성 중 오류가 발생했습니다.' });
  }
};

// 모든 주문 조회 (관리자용)
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email')
      .populate('productId', 'name productNumber')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    console.error('주문 조회 오류:', error);
    res.status(500).json({ message: '주문 조회에 실패했습니다.' });
  }
};

// 사용자별 주문 조회
const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // userId로 사용자 정보를 먼저 조회
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    
    // userEmail으로 주문 검색
    const orders = await Order.find({ userEmail: user.email })
      .populate('productId', 'name productNumber image')
      .sort({ createdAt: -1 });
    
    res.json({
      orders: orders,
      total: orders.length,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('사용자 주문 조회 오류:', error);
    res.status(500).json({ message: '사용자 주문 조회에 실패했습니다.' });
  }
};

// 주문 상세 조회
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate('userId', 'name email phone')
      .populate('productId', 'name productNumber image description');
    
    if (!order) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('주문 상세 조회 오류:', error);
    res.status(500).json({ message: '주문 조회에 실패했습니다.' });
  }
};

// 주문 상태 변경
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['대기중', '처리중', '진행 중', '작업완료', '작업취소', '완료', '취소'].includes(status)) {
      return res.status(400).json({ message: '유효하지 않은 상태입니다.' });
    }

    let updatedOrder;
    
    // MongoDB ObjectId인지 확인
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // MongoDB ObjectId인 경우
      updatedOrder = await Order.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );
    } else {
      // orderId인 경우
      updatedOrder = await Order.findOneAndUpdate(
        { orderId: id },
        { status },
        { new: true }
      );
    }

    if (!updatedOrder) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    res.json({ message: '주문 상태가 변경되었습니다.', order: updatedOrder });
  } catch (error) {
    console.error('주문 상태 변경 오류:', error);
    res.status(500).json({ message: '주문 상태 변경에 실패했습니다.' });
  }
};

// 구매확정 상태 변경
const updateConfirmStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmStatus } = req.body;

    if (!confirmStatus || !['구매확정전', '구매확정', '구매완료'].includes(confirmStatus)) {
      return res.status(400).json({ message: '유효하지 않은 구매확정 상태입니다.' });
    }

    let updatedOrder;
    
    // MongoDB ObjectId인지 확인
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // MongoDB ObjectId인 경우
      updatedOrder = await Order.findByIdAndUpdate(
        id,
        { confirmStatus },
        { new: true }
      );
    } else {
      // orderId인 경우
      updatedOrder = await Order.findOneAndUpdate(
        { orderId: id },
        { confirmStatus },
        { new: true }
      );
    }

    if (!updatedOrder) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    res.json({ message: '구매확정 상태가 변경되었습니다.', order: updatedOrder });
  } catch (error) {
    console.error('구매확정 상태 변경 오류:', error);
    res.status(500).json({ message: '구매확정 상태 변경에 실패했습니다.' });
  }
};

// 주문 삭제
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    // MongoDB ObjectId인지 확인
    let deletedOrder;
    
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // MongoDB ObjectId인 경우
      deletedOrder = await Order.findByIdAndDelete(id);
    } else {
      // orderId인 경우
      deletedOrder = await Order.findOneAndDelete({ orderId: id });
    }
    
    if (!deletedOrder) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    res.json({ message: '주문이 삭제되었습니다.' });
  } catch (error) {
    console.error('주문 삭제 오류:', error);
    res.status(500).json({ message: '주문 삭제에 실패했습니다.' });
  }
};

// 주문 통계
const getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: '대기중' });
    const processingOrders = await Order.countDocuments({ status: '처리중' });
    const completedOrders = await Order.countDocuments({ status: '완료' });
    const cancelledOrders = await Order.countDocuments({ status: '취소' });

    const stats = {
      total: totalOrders,
      pending: pendingOrders,
      processing: processingOrders,
      completed: completedOrders,
      cancelled: cancelledOrders
    };

    res.json(stats);
  } catch (error) {
    console.error('주문 통계 조회 오류:', error);
    res.status(500).json({ message: '주문 통계 조회에 실패했습니다.' });
  }
};

// 요청사항 수정
const updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { request } = req.body;

    if (!request) {
      return res.status(400).json({ message: '요청사항을 입력해주세요.' });
    }

    let updatedOrder;
    
    // MongoDB ObjectId인지 확인
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // MongoDB ObjectId인 경우
      updatedOrder = await Order.findByIdAndUpdate(
        id,
        { request },
        { new: true }
      );
    } else {
      // orderId인 경우
      updatedOrder = await Order.findOneAndUpdate(
        { orderId: id },
        { request },
        { new: true }
      );
    }

    if (!updatedOrder) {
      return res.status(404).json({ message: '요청사항이 수정되었습니다.' });
    }

    res.json({ message: '요청사항이 수정되었습니다.', order: updatedOrder });
  } catch (error) {
    console.error('요청사항 수정 오류:', error);
    res.status(500).json({ message: '요청사항 수정에 실패했습니다.' });
  }
};

// 결제일 업데이트
const updatePaymentDate = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentDate } = req.body;

    if (!paymentDate) {
      return res.status(400).json({ message: '결제일을 입력해주세요.' });
    }

    let updatedOrder;
    
    // MongoDB ObjectId인지 확인
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // MongoDB ObjectId인 경우
      updatedOrder = await Order.findByIdAndUpdate(
        id,
        { paymentDate },
        { new: true }
      );
    } else {
      // orderId인 경우
      updatedOrder = await Order.findOneAndUpdate(
        { orderId: id },
        { paymentDate },
        { new: true }
      );
    }

    if (!updatedOrder) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    res.json({ message: '결제일이 업데이트되었습니다.', order: updatedOrder });
  } catch (error) {
    console.error('결제일 업데이트 오류:', error);
    res.status(500).json({ message: '결제일 업데이트에 실패했습니다.' });
  }
};

// 리뷰 상태 업데이트
const updateReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { review } = req.body;

    if (!review) {
      return res.status(400).json({ message: '리뷰 상태를 입력해주세요.' });
    }

    let updatedOrder;
    
    // MongoDB ObjectId인지 확인
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // MongoDB ObjectId인 경우
      updatedOrder = await Order.findByIdAndUpdate(
        id,
        { review },
        { new: true }
      );
    } else {
      // orderId인 경우
      updatedOrder = await Order.findOneAndUpdate(
        { orderId: id },
        { review },
        { new: true }
      );
    }

    if (!updatedOrder) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    res.json({ message: '리뷰 상태가 업데이트되었습니다.', order: updatedOrder });
  } catch (error) {
    console.error('리뷰 상태 업데이트 오류:', error);
    res.status(500).json({ message: '리뷰 상태 업데이트에 실패했습니다.' });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  updateConfirmStatus,
  updateRequest,
  updatePaymentDate,
  updateReviewStatus,
  deleteOrder,
  getOrderStats
}; 