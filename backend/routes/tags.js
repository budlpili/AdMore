const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 모든 태그 조회
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM tags ORDER BY name ASC';
  
  db.all(sql, [], (err, tags) => {
    if (err) {
      console.error('태그 조회 오류:', err);
      return res.status(500).json({ message: '태그 조회 중 오류가 발생했습니다.' });
    }
    
    res.json(tags || []);
  });
});

// 새 태그 추가
router.post('/', (req, res) => {
  const { name } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({ message: '태그명을 입력해주세요.' });
  }
  
  const trimmedName = name.trim();
  
  // 중복 확인
  db.get('SELECT * FROM tags WHERE name = ?', [trimmedName], (err, existing) => {
    if (err) {
      console.error('태그 중복 확인 오류:', err);
      return res.status(500).json({ message: '태그 중복 확인 중 오류가 발생했습니다.' });
    }
    
    if (existing) {
      return res.status(400).json({ message: '이미 존재하는 태그명입니다.' });
    }
    
    // 새 태그 추가
    const sql = 'INSERT INTO tags (name, type) VALUES (?, ?)';
    db.run(sql, [trimmedName, 'custom'], function(err) {
      if (err) {
        console.error('태그 추가 오류:', err);
        return res.status(500).json({ message: '태그 추가 중 오류가 발생했습니다.' });
      }
      
      res.status(201).json({ 
        message: '태그가 성공적으로 추가되었습니다.',
        id: this.lastID,
        name: trimmedName
      });
    });
  });
});

// 태그 수정
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({ message: '태그명을 입력해주세요.' });
  }
  
  const trimmedName = name.trim();
  
  // 기존 태그 확인
  db.get('SELECT * FROM tags WHERE id = ?', [id], (err, tag) => {
    if (err) {
      console.error('태그 확인 오류:', err);
      return res.status(500).json({ message: '태그 확인 중 오류가 발생했습니다.' });
    }
    
    if (!tag) {
      return res.status(404).json({ message: '태그를 찾을 수 없습니다.' });
    }
    
    // 중복 확인 (자기 자신 제외)
    db.get('SELECT * FROM tags WHERE name = ? AND id != ?', [trimmedName, id], (err, existing) => {
      if (err) {
        console.error('태그 중복 확인 오류:', err);
        return res.status(500).json({ message: '태그 중복 확인 중 오류가 발생했습니다.' });
      }
      
      if (existing) {
        return res.status(400).json({ message: '이미 존재하는 태그명입니다.' });
      }
      
      // 태그 수정
      const sql = 'UPDATE tags SET name = ?, updatedAt = datetime("now", "localtime") WHERE id = ?';
      db.run(sql, [trimmedName, id], function(err) {
        if (err) {
          console.error('태그 수정 오류:', err);
          return res.status(500).json({ message: '태그 수정 중 오류가 발생했습니다.' });
        }
        
        res.json({ 
          message: '태그가 성공적으로 수정되었습니다.',
          id: parseInt(id),
          name: trimmedName
        });
      });
    });
  });
});

// 태그 삭제
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // 태그 사용 여부 확인 (상품의 tags 필드에서 확인)
  db.get('SELECT COUNT(*) as count FROM products WHERE tags LIKE ?', [`%${id}%`], (err, result) => {
    if (err) {
      console.error('태그 사용 여부 확인 오류:', err);
      return res.status(500).json({ message: '태그 사용 여부 확인 중 오류가 발생했습니다.' });
    }
    
    if (result.count > 0) {
      return res.status(400).json({ message: '이 태그를 사용하는 상품이 있어 삭제할 수 없습니다.' });
    }
    
    // 태그 삭제
    const sql = 'DELETE FROM tags WHERE id = ?';
    db.run(sql, [id], function(err) {
      if (err) {
        console.error('태그 삭제 오류:', err);
        return res.status(500).json({ message: '태그 삭제 중 오류가 발생했습니다.' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ message: '태그를 찾을 수 없습니다.' });
      }
      
      res.json({ message: '태그가 성공적으로 삭제되었습니다.' });
    });
  });
});

// 상품에서 사용 중인 태그 목록 조회
router.get('/product-tags', (req, res) => {
  const sql = 'SELECT DISTINCT tags FROM products WHERE tags IS NOT NULL AND tags != ""';
  
  db.all(sql, [], (err, results) => {
    if (err) {
      console.error('상품 태그 조회 오류:', err);
      return res.status(500).json({ message: '상품 태그 조회 중 오류가 발생했습니다.' });
    }
    
    // 태그 문자열을 파싱하여 고유한 태그 목록 생성
    const allTags = new Set();
    results.forEach(result => {
      if (result.tags) {
        const tags = result.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        tags.forEach(tag => allTags.add(tag));
      }
    });
    
    const uniqueTags = Array.from(allTags).sort().map(name => ({ name }));
    res.json(uniqueTags || []);
  });
});

module.exports = router; 