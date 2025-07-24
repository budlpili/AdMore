const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 모든 카테고리 조회
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM categories ORDER BY name ASC';
  
  db.all(sql, [], (err, categories) => {
    if (err) {
      console.error('카테고리 조회 오류:', err);
      return res.status(500).json({ message: '카테고리 조회 중 오류가 발생했습니다.' });
    }
    
    res.json(categories || []);
  });
});

// 새 카테고리 추가
router.post('/', (req, res) => {
  const { name } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({ message: '카테고리명을 입력해주세요.' });
  }
  
  const trimmedName = name.trim();
  
  // 중복 확인
  db.get('SELECT * FROM categories WHERE name = ?', [trimmedName], (err, existing) => {
    if (err) {
      console.error('카테고리 중복 확인 오류:', err);
      return res.status(500).json({ message: '카테고리 중복 확인 중 오류가 발생했습니다.' });
    }
    
    if (existing) {
      return res.status(400).json({ message: '이미 존재하는 카테고리명입니다.' });
    }
    
    // 새 카테고리 추가
    const sql = 'INSERT INTO categories (name, type) VALUES (?, ?)';
    db.run(sql, [trimmedName, 'custom'], function(err) {
      if (err) {
        console.error('카테고리 추가 오류:', err);
        return res.status(500).json({ message: '카테고리 추가 중 오류가 발생했습니다.' });
      }
      
      res.status(201).json({ 
        message: '카테고리가 성공적으로 추가되었습니다.',
        id: this.lastID,
        name: trimmedName
      });
    });
  });
});

// 카테고리 수정
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({ message: '카테고리명을 입력해주세요.' });
  }
  
  const trimmedName = name.trim();
  
  // 기존 카테고리 확인
  db.get('SELECT * FROM categories WHERE id = ?', [id], (err, category) => {
    if (err) {
      console.error('카테고리 확인 오류:', err);
      return res.status(500).json({ message: '카테고리 확인 중 오류가 발생했습니다.' });
    }
    
    if (!category) {
      return res.status(404).json({ message: '카테고리를 찾을 수 없습니다.' });
    }
    
    // 중복 확인 (자기 자신 제외)
    db.get('SELECT * FROM categories WHERE name = ? AND id != ?', [trimmedName, id], (err, existing) => {
      if (err) {
        console.error('카테고리 중복 확인 오류:', err);
        return res.status(500).json({ message: '카테고리 중복 확인 중 오류가 발생했습니다.' });
      }
      
      if (existing) {
        return res.status(400).json({ message: '이미 존재하는 카테고리명입니다.' });
      }
      
      // 카테고리 수정
      const sql = 'UPDATE categories SET name = ?, updatedAt = datetime("now", "localtime") WHERE id = ?';
      db.run(sql, [trimmedName, id], function(err) {
        if (err) {
          console.error('카테고리 수정 오류:', err);
          return res.status(500).json({ message: '카테고리 수정 중 오류가 발생했습니다.' });
        }
        
        res.json({ 
          message: '카테고리가 성공적으로 수정되었습니다.',
          id: parseInt(id),
          name: trimmedName
        });
      });
    });
  });
});

// 카테고리 삭제
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // 카테고리 사용 여부 확인
  db.get('SELECT COUNT(*) as count FROM products WHERE category = (SELECT name FROM categories WHERE id = ?)', [id], (err, result) => {
    if (err) {
      console.error('카테고리 사용 여부 확인 오류:', err);
      return res.status(500).json({ message: '카테고리 사용 여부 확인 중 오류가 발생했습니다.' });
    }
    
    if (result.count > 0) {
      return res.status(400).json({ message: '이 카테고리를 사용하는 상품이 있어 삭제할 수 없습니다.' });
    }
    
    // 카테고리 삭제
    const sql = 'DELETE FROM categories WHERE id = ?';
    db.run(sql, [id], function(err) {
      if (err) {
        console.error('카테고리 삭제 오류:', err);
        return res.status(500).json({ message: '카테고리 삭제 중 오류가 발생했습니다.' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ message: '카테고리를 찾을 수 없습니다.' });
      }
      
      res.json({ message: '카테고리가 성공적으로 삭제되었습니다.' });
    });
  });
});

// 상품에서 사용 중인 카테고리 목록 조회
router.get('/product-categories', (req, res) => {
  const sql = 'SELECT DISTINCT category as name FROM products WHERE category IS NOT NULL AND category != "" ORDER BY category ASC';
  
  db.all(sql, [], (err, categories) => {
    if (err) {
      console.error('상품 카테고리 조회 오류:', err);
      return res.status(500).json({ message: '상품 카테고리 조회 중 오류가 발생했습니다.' });
    }
    
    res.json(categories || []);
  });
});

module.exports = router; 