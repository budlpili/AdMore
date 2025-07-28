const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 모든 리뷰 조회
router.get('/', (req, res) => {
  const { productId } = req.query;
  
  let query = `
    SELECT r.*, p.name as productName, p.category, p.tags, p.image, p.background
    FROM reviews r
    LEFT JOIN products p ON r.productId = p.id
  `;
  
  if (productId) {
    query += ` WHERE r.productId = ?`;
    query += ` ORDER BY r.createdAt DESC`;
    
    db.all(query, [productId], (err, rows) => {
      if (err) {
        console.error('리뷰 조회 오류:', err);
        return res.status(500).json({ message: '리뷰 조회 중 오류가 발생했습니다.' });
      }
      res.json(rows);
    });
  } else {
    query += ` ORDER BY r.createdAt DESC`;
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('리뷰 조회 오류:', err);
        return res.status(500).json({ message: '리뷰 조회 중 오류가 발생했습니다.' });
      }
      res.json(rows);
    });
  }
});

// 특정 리뷰 조회
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get(`
    SELECT r.*, p.name as productName 
    FROM reviews r 
    LEFT JOIN products p ON r.productId = p.id 
    WHERE r.id = ?
  `, [id], (err, row) => {
    if (err) {
      console.error('리뷰 조회 오류:', err);
      return res.status(500).json({ message: '리뷰 조회 중 오류가 발생했습니다.' });
    }
    if (!row) {
      return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
    }
    res.json(row);
  });
});

// 리뷰 등록
router.post('/', (req, res) => {
  const { productId, userEmail, rating, content, orderId } = req.body;
  
  if (!productId || !userEmail || !rating || !content) {
    return res.status(400).json({ message: '필수 필드가 누락되었습니다.' });
  }
  
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: '별점은 1-5 사이여야 합니다.' });
  }
  
  db.run(`
    INSERT INTO reviews (productId, userEmail, rating, content, orderId)
    VALUES (?, ?, ?, ?, ?)
  `, [productId, userEmail, rating, content, orderId], function(err) {
    if (err) {
      console.error('리뷰 등록 오류:', err);
      return res.status(500).json({ message: '리뷰 등록 중 오류가 발생했습니다.' });
    }
    
    // 상품의 평균 별점과 리뷰 수 업데이트
    db.run(`
      UPDATE products 
      SET rating = (
        SELECT AVG(rating) 
        FROM reviews 
        WHERE productId = ?
      ),
      reviewCount = (
        SELECT COUNT(*) 
        FROM reviews 
        WHERE productId = ?
      )
      WHERE id = ?
    `, [productId, productId, productId], (updateErr) => {
      if (updateErr) {
        console.error('상품 평점 업데이트 오류:', updateErr);
      }
    });
    
    res.status(201).json({ 
      message: '리뷰가 성공적으로 등록되었습니다.',
      reviewId: this.lastID 
    });
  });
});

// 리뷰 수정
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { rating, content, orderId } = req.body;
  
  if (!rating || !content) {
    return res.status(400).json({ message: '필수 필드가 누락되었습니다.' });
  }
  
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: '별점은 1-5 사이여야 합니다.' });
  }
  
  db.run(`
    UPDATE reviews 
    SET rating = ?, content = ?, orderId = ?, createdAt = datetime('now', 'localtime')
    WHERE id = ?
  `, [rating, content, orderId, id], function(err) {
    if (err) {
      console.error('리뷰 수정 오류:', err);
      return res.status(500).json({ message: '리뷰 수정 중 오류가 발생했습니다.' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
    }
    
    // 상품의 평균 별점 업데이트
    db.get('SELECT productId FROM reviews WHERE id = ?', [id], (err, row) => {
      if (row) {
        db.run(`
          UPDATE products 
          SET rating = (
            SELECT AVG(rating) 
            FROM reviews 
            WHERE productId = ?
          )
          WHERE id = ?
        `, [row.productId, row.productId]);
      }
    });
    
    res.json({ message: '리뷰가 성공적으로 수정되었습니다.' });
  });
});

// 리뷰 삭제
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT productId FROM reviews WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('리뷰 조회 오류:', err);
      return res.status(500).json({ message: '리뷰 조회 중 오류가 발생했습니다.' });
    }
    
    if (!row) {
      return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
    }
    
    const productId = row.productId;
    
    db.run('DELETE FROM reviews WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('리뷰 삭제 오류:', err);
        return res.status(500).json({ message: '리뷰 삭제 중 오류가 발생했습니다.' });
      }
      
      // 상품의 평균 별점과 리뷰 수 업데이트
      db.run(`
        UPDATE products 
        SET rating = COALESCE((
          SELECT AVG(rating) 
          FROM reviews 
          WHERE productId = ?
        ), 0),
        reviewCount = (
          SELECT COUNT(*) 
          FROM reviews 
          WHERE productId = ?
        )
        WHERE id = ?
      `, [productId, productId, productId]);
      
      res.json({ message: '리뷰가 성공적으로 삭제되었습니다.' });
    });
  });
});

// 관리자 댓글 추가
router.post('/:id/admin-reply', (req, res) => {
  const { id } = req.params;
  const { adminReply } = req.body;
  
  if (!adminReply || !adminReply.trim()) {
    return res.status(400).json({ message: '관리자 댓글 내용이 필요합니다.' });
  }
  
  db.run(`
    UPDATE reviews 
    SET adminReply = ?, adminReplyTime = datetime('now', 'localtime')
    WHERE id = ?
  `, [adminReply.trim(), id], function(err) {
    if (err) {
      console.error('관리자 댓글 추가 오류:', err);
      return res.status(500).json({ message: '관리자 댓글 추가 중 오류가 발생했습니다.' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
    }
    
    res.json({ message: '관리자 댓글이 성공적으로 추가되었습니다.' });
  });
});

// 관리자 댓글 수정
router.put('/:id/admin-reply', (req, res) => {
  const { id } = req.params;
  const { adminReply } = req.body;
  
  if (!adminReply || !adminReply.trim()) {
    return res.status(400).json({ message: '관리자 댓글 내용이 필요합니다.' });
  }
  
  db.run(`
    UPDATE reviews 
    SET adminReply = ?, adminReplyTime = datetime('now', 'localtime')
    WHERE id = ?
  `, [adminReply.trim(), id], function(err) {
    if (err) {
      console.error('관리자 댓글 수정 오류:', err);
      return res.status(500).json({ message: '관리자 댓글 수정 중 오류가 발생했습니다.' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
    }
    
    res.json({ message: '관리자 댓글이 성공적으로 수정되었습니다.' });
  });
});

// 관리자 댓글 삭제
router.delete('/:id/admin-reply', (req, res) => {
  const { id } = req.params;
  
  db.run(`
    UPDATE reviews 
    SET adminReply = NULL, adminReplyTime = NULL
    WHERE id = ?
  `, [id], function(err) {
    if (err) {
      console.error('관리자 댓글 삭제 오류:', err);
      return res.status(500).json({ message: '관리자 댓글 삭제 중 오류가 발생했습니다.' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
    }
    
    res.json({ message: '관리자 댓글이 성공적으로 삭제되었습니다.' });
  });
});

module.exports = router; 