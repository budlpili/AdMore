const express = require('express');
const router = express.Router();
const { register, login, adminLogin, verifyAdminPassword, getProfile, updateProfile, changePassword } = require('../controllers/userController');
const { auth } = require('../middleware/auth');

// 회원가입
router.post('/register', register);

// 로그인
router.post('/login', login);

// 관리자 로그인
router.post('/admin/login', adminLogin);

// 관리자 비밀번호 확인
router.post('/admin/verify-password', verifyAdminPassword);

// 프로필 조회 (인증 필요)
router.get('/profile', auth, getProfile);

// 프로필 수정 (인증 필요)
router.put('/profile', auth, updateProfile);

// 비밀번호 변경 (인증 필요)
router.put('/change-password', auth, changePassword);

module.exports = router; 