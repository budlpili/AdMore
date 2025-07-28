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

module.exports = router; 