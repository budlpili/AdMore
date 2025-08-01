const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 회원가입
router.post('/register', (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: '필수 필드가 누락되었습니다.' });
  }

  // 이메일 중복 확인
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
    
    if (user) {
      return res.status(400).json({ message: '이미 존재하는 이메일입니다.' });
    }

    // 비밀번호 해시화
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ message: '비밀번호 암호화 오류가 발생했습니다.' });
      }

      // 사용자 생성
      const sql = `INSERT INTO users (name, email, password, phone, joinDate, status, role) 
                   VALUES (?, ?, ?, ?, datetime('now', 'localtime'), 'active', 'user')`;
      db.run(sql, [name, email, hashedPassword, phone], function(err) {
        if (err) {
          return res.status(500).json({ message: '회원가입에 실패했습니다.' });
        }

        // JWT 토큰 생성
        const token = jwt.sign(
          { id: this.lastID, email, role: 'user' },
          process.env.JWT_SECRET || 'admore_jwt_secret_key_2024',
          { expiresIn: '24h' }
        );

        res.status(201).json({
          message: '회원가입이 완료되었습니다.',
          token,
          user: { 
            id: this.lastID, 
            name, 
            email, 
            role: 'user',
            status: 'active'
          }
        });
      });
    });
  });
});

// 모든 회원 목록 조회
router.get('/', (req, res) => {
  db.all('SELECT id, name, email, phone, joinDate, status, role FROM users', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: '회원 목록 조회 중 오류가 발생했습니다.' });
    }
    res.json({ users: rows });
  });
});

// 특정 회원 조회
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT id, name, email, phone, joinDate, status, role FROM users WHERE id = ?', [id], (err, user) => {
    if (err) {
      return res.status(500).json({ message: '회원 조회 중 오류가 발생했습니다.' });
    }
    
    if (!user) {
      return res.status(404).json({ message: '회원을 찾을 수 없습니다.' });
    }
    
    res.json({ user });
  });
});

// 회원 상태 변경
router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
    return res.status(400).json({ message: '유효하지 않은 상태값입니다.' });
  }
  
  db.run('UPDATE users SET status = ? WHERE id = ?', [status, id], function(err) {
    if (err) {
      return res.status(500).json({ message: '회원 상태 변경 중 오류가 발생했습니다.' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ message: '회원을 찾을 수 없습니다.' });
    }
    
    res.json({ message: '회원 상태가 성공적으로 변경되었습니다.' });
  });
});

// 회원 역할 변경
router.put('/:id/role', (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  
  if (!role || !['admin', 'user'].includes(role)) {
    return res.status(400).json({ message: '유효하지 않은 역할값입니다.' });
  }
  
  db.run('UPDATE users SET role = ? WHERE id = ?', [role, id], function(err) {
    if (err) {
      return res.status(500).json({ message: '회원 역할 변경 중 오류가 발생했습니다.' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ message: '회원을 찾을 수 없습니다.' });
    }
    
    res.json({ message: '회원 역할이 성공적으로 변경되었습니다.' });
  });
});

// 회원 삭제
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: '회원 삭제 중 오류가 발생했습니다.' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ message: '회원을 찾을 수 없습니다.' });
    }
    
    res.json({ message: '회원이 성공적으로 삭제되었습니다.' });
  });
});

module.exports = router; 