const db = require('../config/database');

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
const createOrder = (req, res) => {
  // 테스트용: 인증이 없을 때는 기본 사용자 ID 사용
  const userId = req.user ? req.user.id : 1;
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

  if (!productId || !price) {
    return res.status(400).json({ message: '필수 필드가 누락되었습니다.' });
  }

  // 먼저 상품 정보를 데이터베이스에서 가져오기
  db.get('SELECT * FROM products WHERE id = ?', [productId], (err, productData) => {
    if (err) {
      return res.status(500).json({ message: '상품 정보 조회 중 오류가 발생했습니다.' });
    }

    if (!productData) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    // 실제 상품 정보 사용
    const actualProductName = productData.name;
    const actualProductDescription = productData.description || productData.name;

    const orderId = generateOrderId();
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // 신용카드 결제의 경우 결제일을 현재 시간으로 설정, 가상계좌는 '-'
    const paymentDate = paymentMethod === 'card' ? currentDate : '-';
    
    const sql = `
      INSERT INTO orders (
        orderId, userId, productId, product, detail, quantity, price, 
        originalPrice, discountPrice, request, date, paymentMethod, 
        paymentNumber, userName, userEmail, status, confirmStatus, paymentDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      orderId, userId, productId, actualProductName, actualProductDescription, 
      quantity, price, originalPrice, discountPrice, request, currentDate, 
      paymentMethod, paymentNumber, userName, userEmail, '대기중', '구매확정전', paymentDate
    ];

    db.run(sql, params, function(err) {
      if (err) {
        console.error('주문 생성 오류:', err);
        return res.status(500).json({ message: '주문 생성 중 오류가 발생했습니다.' });
      }

      res.status(201).json({
        message: '주문이 성공적으로 생성되었습니다.',
        orderId: orderId,
        order: {
          id: this.lastID,
          orderId: orderId,
          productId: productId,
          product: actualProductName,
          detail: actualProductDescription,
          quantity: quantity,
          price: price,
          status: '대기중',
          confirmStatus: '구매확정전',
          date: currentDate,
          paymentDate: paymentDate
        }
      });
    });
  });
};

// 사용자 주문 목록 조회
const getUserOrders = (req, res) => {
  // 테스트용: 인증이 없을 때는 모든 주문 반환
  const userId = req.user ? req.user.id : null;
  const { status, startDate, endDate, page = 1, limit = 10 } = req.query;
  
  let sql = 'SELECT * FROM orders';
  const params = [];

  // userId가 있으면 해당 사용자의 주문만 필터링
  if (userId) {
    sql += ' WHERE userId = ?';
    params.push(userId);
  }

  if (status && status !== '전체 상태') {
    const whereClause = userId ? ' AND' : ' WHERE';
    if (status === '가상계좌발급') {
      sql += `${whereClause} paymentMethod = "가상계좌" AND (paymentDate IS NULL OR paymentDate = "-")`;
    } else if (status === '작업완료') {
      sql += `${whereClause} status = "작업완료" AND confirmStatus != "구매완료"`;
    } else if (status === '구매완료') {
      sql += `${whereClause} status = "작업완료" AND confirmStatus = "구매완료"`;
    } else {
      sql += `${whereClause} status = ?`;
      params.push(status);
    }
  }

  if (startDate) {
    const whereClause = sql.includes('WHERE') ? ' AND' : ' WHERE';
    sql += `${whereClause} date >= ?`;
    params.push(startDate);
  }

  if (endDate) {
    const whereClause = sql.includes('WHERE') ? ' AND' : ' WHERE';
    sql += `${whereClause} date <= ?`;
    params.push(endDate);
  }

  sql += ' ORDER BY date DESC';

  // 전체 개수 조회
  db.get(sql.replace('*', 'COUNT(*) as count'), params, (err, countResult) => {
    if (err) {
      return res.status(500).json({ message: '주문 조회 중 오류가 발생했습니다.' });
    }

    // 페이지네이션 적용
    const offset = (page - 1) * limit;
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    db.all(sql, params, (err, orders) => {
      if (err) {
        return res.status(500).json({ message: '주문 조회 중 오류가 발생했습니다.' });
      }

      res.json({
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(countResult.count / limit),
          totalItems: countResult.count,
          itemsPerPage: parseInt(limit)
        }
      });
    });
  });
};

// 주문 상세 조회
const getOrderById = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const sql = 'SELECT * FROM orders WHERE id = ? AND userId = ?';
  
  db.get(sql, [id, userId], (err, order) => {
    if (err) {
      return res.status(500).json({ message: '주문 조회 중 오류가 발생했습니다.' });
    }

    if (!order) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    res.json(order);
  });
};

// 주문 상태 업데이트 (관리자용)
const updateOrderStatus = (req, res) => {
  const { id } = req.params;
  const { status, paymentDate, confirmStatus } = req.body;

  let sql = 'UPDATE orders SET updatedAt = datetime("now", "localtime")';
  const params = [];

  if (status) {
    sql += ', status = ?';
    params.push(status);
  }

  if (paymentDate !== undefined) {
    sql += ', paymentDate = ?';
    params.push(paymentDate);
  }

  if (confirmStatus) {
    sql += ', confirmStatus = ?';
    params.push(confirmStatus);
  }

  sql += ' WHERE id = ?';
  params.push(id);

  db.run(sql, params, function(err) {
    if (err) {
      return res.status(500).json({ message: '주문 상태 업데이트에 실패했습니다.' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    res.json({ message: '주문 상태가 업데이트되었습니다.' });
  });
};

// 구매확정 처리
const confirmPurchase = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const sql = 'UPDATE orders SET confirmStatus = "구매완료" WHERE id = ? AND userId = ?';
  
  db.run(sql, [id, userId], function(err) {
    if (err) {
      return res.status(500).json({ message: '구매확정 처리에 실패했습니다.' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    res.json({ message: '구매확정이 완료되었습니다.' });
  });
};

// 모든 주문 조회 (관리자용)
const getAllOrders = (req, res) => {
  const { status, search, page = 1, limit = 10 } = req.query;
  
  let sql = 'SELECT o.*, u.name as userName, u.email as userEmail FROM orders o LEFT JOIN users u ON o.userId = u.id WHERE 1=1';
  const params = [];

  if (status && status !== 'all') {
    if (status === '가상계좌발급') {
      sql += ' AND o.paymentMethod = "가상계좌" AND (o.paymentDate IS NULL OR o.paymentDate = "-")';
    } else if (status === '작업완료') {
      sql += ' AND o.status = "작업완료" AND o.confirmStatus != "구매완료"';
    } else if (status === '구매완료') {
      sql += ' AND o.status = "작업완료" AND o.confirmStatus = "구매완료"';
    } else {
      sql += ' AND o.status = ?';
      params.push(status);
    }
  }

  if (search) {
    sql += ' AND (o.product LIKE ? OR o.orderId LIKE ? OR u.name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY o.date DESC';

  // 전체 개수 조회
  db.get(sql.replace('o.*, u.name as userName, u.email as userEmail', 'COUNT(*) as count'), params, (err, countResult) => {
    if (err) {
      return res.status(500).json({ message: '주문 조회 중 오류가 발생했습니다.' });
    }

    // 페이지네이션 적용
    const offset = (page - 1) * limit;
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    db.all(sql, params, (err, orders) => {
      if (err) {
        return res.status(500).json({ message: '주문 조회 중 오류가 발생했습니다.' });
      }

      res.json({
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(countResult.count / limit),
          totalItems: countResult.count,
          itemsPerPage: parseInt(limit)
        }
      });
    });
  });
};

// 주문 삭제 (테스트용)
const deleteOrder = (req, res) => {
  const { id } = req.params;
  
  const sql = 'DELETE FROM orders WHERE id = ?';
  
  db.run(sql, [id], function(err) {
    if (err) {
      return res.status(500).json({ message: '주문 삭제에 실패했습니다.' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    res.json({ message: '주문이 삭제되었습니다.' });
  });
};

// 기존 신용카드 주문들의 결제일 업데이트 (테스트용)
const updateExistingCardPayments = (req, res) => {
  const sql = `
    UPDATE orders 
    SET paymentDate = date 
    WHERE paymentMethod = 'card' AND (paymentDate IS NULL OR paymentDate = '-')
  `;
  
  db.run(sql, function(err) {
    if (err) {
      console.error('결제일 업데이트 오류:', err);
      return res.status(500).json({ message: '결제일 업데이트 중 오류가 발생했습니다.' });
    }
    
    res.json({ 
      message: '기존 신용카드 주문들의 결제일이 업데이트되었습니다.',
      updatedCount: this.changes 
    });
  });
};

module.exports = { 
  createOrder, 
  getUserOrders, 
  getOrderById, 
  updateOrderStatus, 
  confirmPurchase, 
  getAllOrders, 
  deleteOrder,
  updateExistingCardPayments 
}; 