const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 쿠폰 목록 조회
router.get('/', (req, res) => {
  const sql = `SELECT * FROM coupon_management ORDER BY createdAt DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('쿠폰 목록 조회 오류:', err);
      res.status(500).json({ success: false, message: '쿠폰 목록 조회에 실패했습니다.' });
    } else {
      res.json({ success: true, coupons: rows });
    }
  });
});

// 쿠폰 생성
router.post('/', (req, res) => {
  const {
    code, name, description, discountType, discountValue, minAmount, maxDiscount,
    startDate, endDate, usageLimit, status
  } = req.body;

  const sql = `INSERT INTO coupon_management (
    code, name, description, discountType, discountValue, minAmount, maxDiscount,
    startDate, endDate, usageLimit, status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const params = [
    code, name, description, discountType, discountValue, minAmount, maxDiscount,
    startDate, endDate, usageLimit, status || 'active'
  ];

  db.run(sql, params, function(err) {
    if (err) {
      console.error('쿠폰 생성 오류:', err);
      res.status(500).json({ success: false, message: '쿠폰 생성에 실패했습니다.' });
    } else {
      res.json({ success: true, id: this.lastID, message: '쿠폰이 생성되었습니다.' });
    }
  });
});

// 쿠폰 수정
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    code, name, description, discountType, discountValue, minAmount, maxDiscount,
    startDate, endDate, usageLimit, status
  } = req.body;

  const sql = `UPDATE coupon_management SET 
    code = ?, name = ?, description = ?, discountType = ?, discountValue = ?, 
    minAmount = ?, maxDiscount = ?, startDate = ?, endDate = ?, usageLimit = ?, 
    status = ?, updatedAt = datetime('now', 'localtime')
    WHERE id = ?`;

  const params = [
    code, name, description, discountType, discountValue, minAmount, maxDiscount,
    startDate, endDate, usageLimit, status, id
  ];

  db.run(sql, params, function(err) {
    if (err) {
      console.error('쿠폰 수정 오류:', err);
      res.status(500).json({ success: false, message: '쿠폰 수정에 실패했습니다.' });
    } else {
      res.json({ success: true, message: '쿠폰이 수정되었습니다.' });
    }
  });
});

// 쿠폰 삭제
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM coupon_management WHERE id = ?`;
  db.run(sql, [id], function(err) {
    if (err) {
      console.error('쿠폰 삭제 오류:', err);
      res.status(500).json({ success: false, message: '쿠폰 삭제에 실패했습니다.' });
    } else {
      res.json({ success: true, message: '쿠폰이 삭제되었습니다.' });
    }
  });
});

// 쿠폰 발송
router.post('/send', (req, res) => {
  const { couponId, userIds } = req.body;

  if (!couponId || !userIds || userIds.length === 0) {
    return res.status(400).json({ success: false, message: '필수 정보가 누락되었습니다.' });
  }

  // 트랜잭션 시작
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    const insertSql = `INSERT INTO coupon_sends (couponId, userId) VALUES (?, ?)`;
    let successCount = 0;
    let errorCount = 0;

    userIds.forEach((userId, index) => {
      db.run(insertSql, [couponId, userId], function(err) {
        if (err) {
          console.error('쿠폰 발송 오류:', err);
          errorCount++;
        } else {
          successCount++;
        }

        // 모든 쿼리가 완료되면 트랜잭션 커밋
        if (index === userIds.length - 1) {
          if (errorCount > 0) {
            db.run('ROLLBACK', (rollbackErr) => {
              if (rollbackErr) {
                console.error('롤백 오류:', rollbackErr);
              }
              res.status(500).json({ 
                success: false, 
                message: `${errorCount}개의 쿠폰 발송에 실패했습니다.` 
              });
            });
          } else {
            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                console.error('커밋 오류:', commitErr);
                res.status(500).json({ success: false, message: '쿠폰 발송에 실패했습니다.' });
              } else {
                res.json({ 
                  success: true, 
                  message: `${successCount}명의 사용자에게 쿠폰이 발송되었습니다.` 
                });
              }
            });
          }
        }
      });
    });
  });
});

// 쿠폰 발송 이력 조회
router.get('/sends/:couponId', (req, res) => {
  const { couponId } = req.params;

  const sql = `
    SELECT cs.*, u.name as userName, u.email as userEmail
    FROM coupon_sends cs
    JOIN users u ON cs.userId = u.id
    WHERE cs.couponId = ?
    ORDER BY cs.sentAt DESC
  `;

  db.all(sql, [couponId], (err, rows) => {
    if (err) {
      console.error('쿠폰 발송 이력 조회 오류:', err);
      res.status(500).json({ success: false, message: '쿠폰 발송 이력 조회에 실패했습니다.' });
    } else {
      res.json({ success: true, sends: rows });
    }
  });
});

module.exports = router; 