const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 공지사항 목록 조회
router.get('/notices', async (req, res) => {
  try {
    const query = `
      SELECT * FROM notices 
      ORDER BY createdAt DESC
    `;
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('공지사항 조회 오류:', err);
        return res.status(500).json({ message: '공지사항 조회 중 오류가 발생했습니다.' });
      }
      res.json(rows || []);
    });
  } catch (error) {
    console.error('공지사항 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 공지사항 상세 조회
router.get('/notices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'SELECT * FROM notices WHERE id = ?';
    
    db.get(query, [id], (err, row) => {
      if (err) {
        console.error('공지사항 상세 조회 오류:', err);
        return res.status(500).json({ message: '공지사항 조회 중 오류가 발생했습니다.' });
      }
      if (!row) {
        return res.status(404).json({ message: '공지사항을 찾을 수 없습니다.' });
      }
      res.json(row);
    });
  } catch (error) {
    console.error('공지사항 상세 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 공지사항 생성
router.post('/notices', async (req, res) => {
  try {
    const { title, content, important, author } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: '제목과 내용은 필수입니다.' });
    }
    
    const query = `
      INSERT INTO notices (title, content, important, author, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
    `;
    
    db.run(query, [title, content, important ? 1 : 0, author || '관리자'], function(err) {
      if (err) {
        console.error('공지사항 생성 오류:', err);
        return res.status(500).json({ message: '공지사항 생성 중 오류가 발생했습니다.' });
      }
      
      // 생성된 공지사항 조회
      const selectQuery = 'SELECT * FROM notices WHERE id = ?';
      db.get(selectQuery, [this.lastID], (err, row) => {
        if (err) {
          console.error('생성된 공지사항 조회 오류:', err);
          return res.status(500).json({ message: '공지사항 생성 중 오류가 발생했습니다.' });
        }
        res.status(201).json(row);
      });
    });
  } catch (error) {
    console.error('공지사항 생성 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 공지사항 수정
router.put('/notices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, important } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: '제목과 내용은 필수입니다.' });
    }
    
    const query = `
      UPDATE notices 
      SET title = ?, content = ?, important = ?, updatedAt = datetime('now', 'localtime')
      WHERE id = ?
    `;
    
    db.run(query, [title, content, important ? 1 : 0, id], function(err) {
      if (err) {
        console.error('공지사항 수정 오류:', err);
        return res.status(500).json({ message: '공지사항 수정 중 오류가 발생했습니다.' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ message: '수정할 공지사항을 찾을 수 없습니다.' });
      }
      
      // 수정된 공지사항 조회
      const selectQuery = 'SELECT * FROM notices WHERE id = ?';
      db.get(selectQuery, [id], (err, row) => {
        if (err) {
          console.error('수정된 공지사항 조회 오류:', err);
          return res.status(500).json({ message: '공지사항 수정 중 오류가 발생했습니다.' });
        }
        res.json(row);
      });
    });
  } catch (error) {
    console.error('공지사항 수정 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 공지사항 삭제
router.delete('/notices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'DELETE FROM notices WHERE id = ?';
    
    db.run(query, [id], function(err) {
      if (err) {
        console.error('공지사항 삭제 오류:', err);
        return res.status(500).json({ message: '공지사항 삭제 중 오류가 발생했습니다.' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ message: '삭제할 공지사항을 찾을 수 없습니다.' });
      }
      
      res.json({ message: '공지사항이 성공적으로 삭제되었습니다.' });
    });
  } catch (error) {
    console.error('공지사항 삭제 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 이용약관 조회
router.get('/terms', async (req, res) => {
  try {
    const query = 'SELECT * FROM terms ORDER BY updatedAt DESC LIMIT 1';
    
    db.get(query, [], (err, row) => {
      if (err) {
        console.error('이용약관 조회 오류:', err);
        return res.status(500).json({ message: '이용약관 조회 중 오류가 발생했습니다.' });
      }
      res.json(row || { content: '', updatedAt: null });
    });
  } catch (error) {
    console.error('이용약관 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 이용약관 저장/수정
router.post('/terms', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: '이용약관 내용은 필수입니다.' });
    }
    
    const query = `
      INSERT OR REPLACE INTO terms (id, content, updatedAt)
      VALUES (1, ?, datetime('now', 'localtime'))
    `;
    
    db.run(query, [content], function(err) {
      if (err) {
        console.error('이용약관 저장 오류:', err);
        return res.status(500).json({ message: '이용약관 저장 중 오류가 발생했습니다.' });
      }
      
      res.json({ message: '이용약관이 성공적으로 저장되었습니다.' });
    });
  } catch (error) {
    console.error('이용약관 저장 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 이용약관 삭제
router.delete('/terms', async (req, res) => {
  try {
    const query = 'DELETE FROM terms WHERE id = 1';
    
    db.run(query, [], function(err) {
      if (err) {
        console.error('이용약관 삭제 오류:', err);
        return res.status(500).json({ message: '이용약관 삭제 중 오류가 발생했습니다.' });
      }
      
      res.json({ message: '이용약관이 성공적으로 삭제되었습니다.' });
    });
  } catch (error) {
    console.error('이용약관 삭제 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 개인정보취급방침 조회
router.get('/privacy', async (req, res) => {
  try {
    const query = 'SELECT * FROM privacy ORDER BY updatedAt DESC LIMIT 1';
    
    db.get(query, [], (err, row) => {
      if (err) {
        console.error('개인정보취급방침 조회 오류:', err);
        return res.status(500).json({ message: '개인정보취급방침 조회 중 오류가 발생했습니다.' });
      }
      res.json(row || { content: '', updatedAt: null });
    });
  } catch (error) {
    console.error('개인정보취급방침 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 개인정보취급방침 저장/수정
router.post('/privacy', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: '개인정보취급방침 내용은 필수입니다.' });
    }
    
    const query = `
      INSERT OR REPLACE INTO privacy (id, content, updatedAt)
      VALUES (1, ?, datetime('now', 'localtime'))
    `;
    
    db.run(query, [content], function(err) {
      if (err) {
        console.error('개인정보취급방침 저장 오류:', err);
        return res.status(500).json({ message: '개인정보취급방침 저장 중 오류가 발생했습니다.' });
      }
      
      res.json({ message: '개인정보취급방침이 성공적으로 저장되었습니다.' });
    });
  } catch (error) {
    console.error('개인정보취급방침 저장 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 개인정보취급방침 삭제
router.delete('/privacy', async (req, res) => {
  try {
    const query = 'DELETE FROM privacy WHERE id = 1';
    
    db.run(query, [], function(err) {
      if (err) {
        console.error('개인정보취급방침 삭제 오류:', err);
        return res.status(500).json({ message: '개인정보취급방침 삭제 중 오류가 발생했습니다.' });
      }
      
      res.json({ message: '개인정보취급방침이 성공적으로 삭제되었습니다.' });
    });
  } catch (error) {
    console.error('개인정보취급방침 삭제 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router; 