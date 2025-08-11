const express = require('express');
const router = express.Router();
const { register, login, adminLogin, verifyAdminPassword, getProfile, updateProfile, changePassword, logout, verifyEmail, resendVerifyEmail } = require('../controllers/userController');
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

// 로그아웃 (인증 필요)
router.post('/logout', auth, logout);

// 이메일 인증 확인
router.get('/verify-email', verifyEmail);
router.post('/resend-verify', resendVerifyEmail);

// 이메일 인증 코드 요청
router.post('/request-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: '이메일 주소가 필요합니다.' });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: '올바른 이메일 형식이 아닙니다.' });
    }

    // 6자리 인증 코드 생성
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 인증 코드를 임시로 저장 (실제로는 Redis나 데이터베이스 사용 권장)
    const tempStorage = global.tempVerificationCodes || new Map();
    tempStorage.set(email, {
      code: verificationCode,
      expires: Date.now() + 10 * 60 * 1000 // 10분 유효
    });
    global.tempVerificationCodes = tempStorage;

    // 이메일 발송을 위해 userController의 함수 사용
    const { getMailTransporter } = require('../controllers/userController');
    const transporter = await getMailTransporter();
    
    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER || 'ADMore <no-reply@admore.local>',
      to: email,
      subject: '애드모어 이메일 인증 코드',
      html: `
        <div style="font-family:Arial,sans-serif;font-size:14px;color:#111">
          <h2>안녕하세요!</h2>
          <p>애드모어 회원가입을 위한 이메일 인증 코드입니다.</p>
          <div style="background:#f5f5f5;padding:20px;border-radius:8px;text-align:center;margin:20px 0;">
            <h3 style="color:#f97316;margin:0;font-size:24px;">${verificationCode}</h3>
            <p style="margin:10px 0 0 0;color:#666;">위의 6자리 코드를 입력해주세요</p>
          </div>
          <p><strong>주의사항:</strong></p>
          <ul>
            <li>이 인증 코드는 10분간 유효합니다</li>
            <li>본인이 요청하지 않은 경우 무시하세요</li>
            <li>코드를 다른 사람에게 알려주지 마세요</li>
          </ul>
          <p>감사합니다!</p>
        </div>
      `,
    });

    res.json({ 
      message: '인증 코드가 이메일로 발송되었습니다.',
      email: email
    });
    
  } catch (error) {
    console.error('이메일 인증 코드 요청 오류:', error);
    res.status(500).json({ message: '인증 코드 발송에 실패했습니다.' });
  }
});

// 이메일 인증 코드 확인
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ message: '이메일과 인증 코드가 필요합니다.' });
    }

    // 저장된 인증 코드 확인
    const tempStorage = global.tempVerificationCodes || new Map();
    const storedData = tempStorage.get(email);
    
    if (!storedData) {
      return res.status(400).json({ message: '인증 코드를 먼저 요청해주세요.' });
    }
    
    if (Date.now() > storedData.expires) {
      tempStorage.delete(email);
      return res.status(400).json({ message: '인증 코드가 만료되었습니다. 다시 요청해주세요.' });
    }
    
    if (storedData.code !== code) {
      return res.status(400).json({ message: '인증 코드가 올바르지 않습니다.' });
    }

    // 인증 성공 시 저장된 코드 삭제
    tempStorage.delete(email);
    
    res.json({ 
      message: '이메일 인증이 완료되었습니다.',
      email: email
    });
    
  } catch (error) {
    console.error('이메일 인증 코드 확인 오류:', error);
    res.status(500).json({ message: '인증 코드 확인에 실패했습니다.' });
  }
});

module.exports = router; 