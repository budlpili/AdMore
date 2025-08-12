const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

// 이메일 발송 트랜스포터 (환경변수 없으면 Ethereal 테스트 계정 사용)
let cachedMailTransporter = null;
async function getMailTransporter() {
  if (cachedMailTransporter) return cachedMailTransporter;

  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').trim();
  const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const hasSmtpCreds = smtpUser.length > 0 && smtpPass.length > 0;
  if (hasSmtpCreds) {
    const secure = smtpPort === 465;
    cachedMailTransporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
    console.log('[Mail] Using real SMTP host:', smtpHost, 'port:', smtpPort, 'secure:', secure);
    return cachedMailTransporter;
  }

  // 개발 환경: Ethereal 자동 생성
  const testAccount = await nodemailer.createTestAccount();
  cachedMailTransporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  console.log('[Mail] Using Ethereal test account:', testAccount.user);
  return cachedMailTransporter;
}

// 사용자 등록
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: '필수 필드가 누락되었습니다.' });
    }

    // 이메일 중복 확인
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: '이미 존재하는 이메일입니다.' });
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 이메일 인증 토큰 생성 (30분 유효)
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + 30 * 60 * 1000);

    // 사용자 생성 (초기 emailVerified=false)
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      emailVerified: false,
      verifyToken,
      verifyExpires
    });

    await user.save();

    try {
      const transporter = await getMailTransporter();
      const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
      const verifyUrl = `${baseUrl}/verify-email?token=${verifyToken}`;

      const info = await transporter.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER || 'ADMore <no-reply@admore.local>',
        to: email,
        subject: '애드모어 이메일 인증을 완료해주세요',
        html: `
          <div style="font-family:Arial,sans-serif;font-size:14px;color:#111">
            <h2>안녕하세요, ${name}님!</h2>
            <p>아래 버튼을 눌러 이메일 인증을 완료해주세요. 링크는 30분간 유효합니다.</p>
            <p><a href="${verifyUrl}" style="display:inline-block;padding:10px 16px;background:#f97316;color:#fff;border-radius:6px;text-decoration:none">이메일 인증</a></p>
            <p>버튼이 동작하지 않으면 링크를 복사하여 브라우저에 붙여넣기 해주세요:</p>
            <p><a href="${verifyUrl}">${verifyUrl}</a></p>
          </div>
        `,
      });

      console.log('이메일 발송 성공:', info.messageId);
      res.status(201).json({ 
        message: '회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요.',
        emailSent: true
      });
    } catch (emailError) {
      console.error('이메일 발송 실패:', emailError);
      // 이메일 발송 실패해도 사용자는 생성됨
      res.status(201).json({ 
        message: '회원가입이 완료되었습니다. 이메일 발송에 실패했지만 나중에 재발송할 수 있습니다.',
        emailSent: false
      });
    }
  } catch (error) {
    console.error('사용자 등록 오류:', error);
    res.status(500).json({ message: '사용자 등록에 실패했습니다.' });
  }
};

// 사용자 로그인
const login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' });
  }

  console.log('[Login] 로그인 시도:', email);

  User.findByEmail(email)
    .then(user => {
      if (!user) {
        console.log('[Login] 사용자 없음:', email);
        return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      }

      console.log('[Login] 사용자 정보:', {
        id: user._id,
        email: user.email,
        emailVerified: user.emailVerified,
        status: user.status
      });

      // 사용자 상태 확인
      if (user.status === 'inactive') {
        console.log('[Login] 비활성화된 계정:', email);
        return res.status(403).json({ message: '비활성화된 계정입니다.' });
      }

      if (user.status === 'suspended') {
        console.log('[Login] 정지된 계정:', email);
        return res.status(403).json({ message: '정지된 계정입니다.' });
      }

      // 이메일 인증 여부 확인 (admin@admore.com은 제외)
      console.log('[Login] 이메일 인증 상태:', user.emailVerified, '타입:', typeof user.emailVerified);
      if (!user.emailVerified && user.email !== 'admin@admore.com') {
        console.log('[Login] 이메일 인증 필요:', email, '상태:', user.emailVerified);
        return res.status(403).json({ message: '이메일 인증이 필요합니다.' });
      }

      console.log('[Login] 이메일 인증 완료 또는 관리자 계정, 비밀번호 확인 진행');

      // 비밀번호 확인
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          console.error('[Login] 비밀번호 확인 오류:', err);
          return res.status(500).json({ message: '비밀번호 확인 중 오류가 발생했습니다.' });
        }

        if (!isMatch) {
          console.log('[Login] 비밀번호 불일치:', email);
          return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
        }

        console.log('[Login] 로그인 성공:', email);

        // 마지막 로그인 시간 업데이트
        User.updateLastLogin(user._id);

        // JWT 토큰 생성
        const token = jwt.sign(
          { id: user._id, email: user.email, role: user.role },
          process.env.JWT_SECRET || 'admore_jwt_secret_key_2024',
          { expiresIn: '24h' }
        );

        res.json({
          message: '로그인이 완료되었습니다.',
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status
          }
        });
      });
    })
    .catch(err => {
      console.error('사용자 로그인 오류:', err);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    });
};

// 이메일 인증 확인
const verifyEmail = (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ message: '토큰이 필요합니다.' });

  User.findByVerifyToken(token)
    .then(user => {
      if (!user) {
        return res.status(400).json({ message: '유효하지 않은 토큰입니다.' });
      }

      if (user.verifyExpires && new Date(user.verifyExpires).getTime() < Date.now()) {
        return res.status(400).json({ message: '토큰이 만료되었습니다.' });
      }

      User.updateEmailVerified(user._id)
        .then(() => {
          res.json({ message: '이메일 인증이 완료되었습니다.' });
        })
        .catch(updateErr => {
          console.error('인증 처리 중 오류:', updateErr);
          res.status(500).json({ message: '인증 처리 중 오류가 발생했습니다.' });
        });
    })
    .catch(err => {
      console.error('이메일 인증 확인 오류:', err);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    });
};

// 관리자 로그인 (개발용)
const adminLogin = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' });
  }

  // 개발용 관리자 계정 (실제 운영에서는 환경변수로 관리)
  const adminEmail = 'admin@admore.com';
  const adminPassword = 'admin123';

  if (email === adminEmail && password === adminPassword) {
    // JWT 토큰 생성
    const token = jwt.sign(
      { id: 1, email: adminEmail, role: 'admin' },
      process.env.JWT_SECRET || 'admore_jwt_secret_key_2024',
      { expiresIn: '24h' }
    );

    res.json({
      message: '관리자 로그인이 완료되었습니다.',
      token,
      user: {
        id: 1,
        name: '관리자',
        email: adminEmail,
        role: 'admin',
        status: 'active'
      }
    });
  } else {
    res.status(401).json({ message: '관리자 계정 정보가 올바르지 않습니다.' });
  }
};

// 관리자 비밀번호 확인
const verifyAdminPassword = (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: '비밀번호를 입력해주세요.' });
  }

  // 개발용 관리자 계정 (실제 운영에서는 환경변수로 관리)
  const adminPassword = 'admin123';

  if (password === adminPassword) {
    res.json({ message: '비밀번호가 확인되었습니다.', verified: true });
  } else {
    res.status(401).json({ message: '관리자 비밀번호가 올바르지 않습니다.', verified: false });
  }
};

// 사용자 정보 조회
const getProfile = (req, res) => {
  const userId = req.user.id;

  User.findById(userId)
    .then(user => {
      if (!user) {
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
      }
      res.json(user);
    })
    .catch(err => {
      console.error('사용자 정보 조회 오류:', err);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    });
};

// 사용자 정보 수정
const updateProfile = (req, res) => {
  const userId = req.user.id;
  const { name, phone } = req.body;

  User.findById(userId)
    .then(user => {
      if (!user) {
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
      }

      user.name = name;
      user.phone = phone;

      return user.save();
    })
    .then(updatedUser => {
      res.json({ message: '프로필이 업데이트되었습니다.' });
    })
    .catch(err => {
      console.error('프로필 업데이트 오류:', err);
      res.status(500).json({ message: '프로필 업데이트에 실패했습니다.' });
    });
};

// 비밀번호 변경
const changePassword = (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: '현재 비밀번호와 새 비밀번호를 입력해주세요.' });
  }

  // 현재 비밀번호 확인
  User.findById(userId)
    .then(user => {
      if (!user) {
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
      }

      return bcrypt.compare(currentPassword, user.password);
    })
    .then(isMatch => {
      if (!isMatch) {
        return res.status(400).json({ message: '현재 비밀번호가 올바르지 않습니다.' });
      }

      // 새 비밀번호 해시화
      return bcrypt.hash(newPassword, 10);
    })
    .then(hashedPassword => {
      return User.updatePassword(req.user.id, hashedPassword);
    })
    .then(() => {
      res.json({ message: '비밀번호가 변경되었습니다.' });
    })
    .catch(err => {
      console.error('비밀번호 변경 오류:', err);
      res.status(500).json({ message: '비밀번호 변경에 실패했습니다.' });
    });
};

// 로그아웃
const logout = (req, res) => {
  try {
    // 클라이언트에서 토큰을 제거하도록 안내
    // 서버 측에서는 토큰 블랙리스트나 세션 관리를 할 수 있지만,
    // 현재 구현에서는 클라이언트 측 토큰 제거로 충분
    res.json({ message: '로그아웃이 완료되었습니다.' });
  } catch (error) {
    console.error('로그아웃 오류:', error);
    res.status(500).json({ message: '로그아웃 처리 중 오류가 발생했습니다.' });
  }
};

// 이메일 인증 메일 재발송
const resendVerifyEmail = (req, res) => {
  const { email, name } = req.body || {};
  if (!email) return res.status(400).json({ message: '이메일이 필요합니다.' });

  User.findByEmail(email)
    .then(user => {
      if (!user) {
        return res.status(404).json({ message: '가입 정보를 찾을 수 없습니다.' });
      }
      if (user.emailVerified === true) {
        return res.status(400).json({ message: '이미 이메일 인증이 완료된 계정입니다.' });
      }

      const verifyToken = crypto.randomBytes(32).toString('hex');
      const verifyExpires = new Date(Date.now() + 30 * 60 * 1000);

      return User.updateVerifyToken(user._id, verifyToken, verifyExpires)
        .then(() => ({ user, verifyToken }));
    })
    .then(async ({ user, verifyToken }) => {
      try {
        const transporter = await getMailTransporter();
        const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
        const verifyUrl = `${baseUrl}/verify-email?token=${verifyToken}`;
        
        const info = await transporter.sendMail({
          from: process.env.MAIL_FROM || process.env.SMTP_USER || 'ADMore <no-reply@admore.local>',
          to: email,
          subject: '애드모어 이메일 인증을 완료해주세요',
          html: `
            <div style="font-family:Arial,sans-serif;font-size:14px;color:#111">
              <h2>안녕하세요, ${name || user.name || ''}님!</h2>
              <p>아래 버튼을 눌러 이메일 인증을 완료해주세요. 링크는 30분간 유효합니다.</p>
              <p><a href="${verifyUrl}" style="display:inline-block;padding:10px 16px;background:#f97316;color:#fff;border-radius:6px;text-decoration:none">이메일 인증</a></p>
              <p>버튼이 동작하지 않으면 링크를 복사하여 브라우저에 붙여넣기 해주세요:</p>
              <p><a href="${verifyUrl}">${verifyUrl}</a></p>
            </div>
          `,
        });
        
        const preview = nodemailer.getTestMessageUrl(info);
        if (preview) console.log('[Mail] Preview URL:', preview);
        res.json({ message: '인증 메일을 재발송했습니다.' });
      } catch (mailErr) {
        console.error('메일 재발송 오류:', mailErr);
        res.status(500).json({ message: '메일 발송 중 오류가 발생했습니다.' });
      }
    })
    .catch(err => {
      console.error('이메일 재발송 오류:', err);
      res.status(500).json({ message: '메일 발송 중 오류가 발생했습니다.' });
    });
};

module.exports = {
  register,
  login,
  adminLogin,
  verifyAdminPassword,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  verifyEmail,
  resendVerifyEmail,
  getMailTransporter
}; 