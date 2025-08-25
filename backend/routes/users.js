const express = require('express');
const router = express.Router();
const { User } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: '필수 필드가 누락되었습니다.' });
    }

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: '이미 존재하는 이메일입니다.' });
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      joinDate: new Date(),
      status: 'active',
      role: 'user'
    });

    const savedUser = await user.save();

    // JWT 토큰 생성
    const token = jwt.sign(
      { id: savedUser._id, email, role: 'user' },
      process.env.JWT_SECRET || 'admore_jwt_secret_key_2024',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      token,
      user: { 
        id: savedUser._id, 
        name, 
        email, 
        role: 'user',
        status: 'active'
      }
    });
  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 모든 회원 목록 조회
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, '_id name email phone joinDate status role emailVerified');
    res.json({ users });
  } catch (error) {
    console.error('회원 목록 조회 오류:', error);
    res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
  }
});

// 특정 회원 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id, 'name email phone joinDate status role emailVerified');
    
    if (!user) {
      return res.status(404).json({ message: '회원을 찾을 수 없습니다.' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('회원 조회 오류:', error);
    res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
  }
});

// 회원 상태 변경
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ message: '유효하지 않은 상태값입니다.' });
    }
    
    const user = await User.findByIdAndUpdate(id, { status }, { new: true });
    
    if (!user) {
      return res.status(404).json({ message: '회원을 찾을 수 없습니다.' });
    }
    
    res.json({ message: '회원 상태가 성공적으로 변경되었습니다.' });
  } catch (error) {
    console.error('회원 상태 변경 오류:', error);
    res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
  }
});

// 회원 역할 변경
router.put('/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: '유효하지 않은 역할값입니다.' });
    }
    
    const user = await User.findByIdAndUpdate(id, { role }, { new: true });
    
    if (!user) {
      return res.status(404).json({ message: '회원을 찾을 수 없습니다.' });
    }
    
    res.json({ message: '회원 역할이 성공적으로 변경되었습니다.' });
  } catch (error) {
    console.error('회원 역할 변경 오류:', error);
    res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
  }
});

// 회원 삭제
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return res.status(404).json({ message: '회원을 찾을 수 없습니다.' });
    }
    
    res.json({ message: '회원이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('회원 삭제 오류:', error);
    res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
  }
});

module.exports = router; 