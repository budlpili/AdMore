const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

// 사용자 등록
const register = (req, res) => {
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

      // 이메일 인증 토큰 생성 (30분 유효)
      const verifyToken = crypto.randomBytes(32).toString('hex');
      const verifyExpires = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      // 사용자 생성 (초기 emailVerified=0)
      const sql = `INSERT INTO users (name, email, password, phone, emailVerified, verifyToken, verifyExpires) VALUES (?, ?, ?, ?, 0, ?, ?)`;
      db.run(sql, [name, email, hashedPassword, phone, verifyToken, verifyExpires], async function(err) {
        if (err) {
          return res.status(500).json({ message: '사용자 등록에 실패했습니다.' });
        }

        try {
          // 인증 메일 발송 설정
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });

          const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
          const verifyUrl = `${baseUrl}/verify-email?token=${verifyToken}`;

          await transporter.sendMail({
            from: process.env.MAIL_FROM || process.env.SMTP_USER,
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

          res.status(201).json({
            message: '사용자 등록이 완료되었습니다. 이메일 인증을 진행해주세요.',
            user: { id: this.lastID, name, email, role: 'user' },
          });
        } catch (mailErr) {
          console.error('메일 발송 오류:', mailErr);
          res.status(201).json({
            message: '사용자 등록은 완료되었으나, 인증 메일 발송에 실패했습니다. 나중에 다시 시도해주세요.',
            user: { id: this.lastID, name, email, role: 'user' },
          });
        }
      });
    });
  });
};

// 사용자 로그인
const login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }

    if (!user) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    // 사용자 상태 확인
    if (user.status === 'inactive') {
      return res.status(403).json({ message: '비활성화된 계정입니다.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ message: '정지된 계정입니다.' });
    }

    // 이메일 인증 여부 확인
    if (user.emailVerified !== 1) {
      return res.status(403).json({ message: '이메일 인증이 필요합니다.' });
    }

    // 비밀번호 확인
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ message: '비밀번호 확인 중 오류가 발생했습니다.' });
      }

      if (!isMatch) {
        return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      }

      // 마지막 로그인 시간 업데이트
      db.run('UPDATE users SET lastLogin = datetime("now", "localtime") WHERE id = ?', [user.id]);

      // JWT 토큰 생성
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'admore_jwt_secret_key_2024',
        { expiresIn: '24h' }
      );

      res.json({
        message: '로그인이 완료되었습니다.',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status
        }
      });
    });
  });
};

// 이메일 인증 확인
const verifyEmail = (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ message: '토큰이 필요합니다.' });

  db.get('SELECT id, verifyExpires FROM users WHERE verifyToken = ?', [token], (err, user) => {
    if (err) return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    if (!user) return res.status(400).json({ message: '유효하지 않은 토큰입니다.' });

    if (user.verifyExpires && new Date(user.verifyExpires).getTime() < Date.now()) {
      return res.status(400).json({ message: '토큰이 만료되었습니다.' });
    }

    db.run('UPDATE users SET emailVerified = 1, verifyToken = NULL, verifyExpires = NULL WHERE id = ?', [user.id], function(updateErr) {
      if (updateErr) return res.status(500).json({ message: '인증 처리 중 오류가 발생했습니다.' });
      return res.json({ message: '이메일 인증이 완료되었습니다.' });
    });
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

  db.get('SELECT id, name, email, phone, joinDate, status, role, lastLogin, orderCount, totalSpent FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    res.json(user);
  });
};

// 사용자 정보 수정
const updateProfile = (req, res) => {
  const userId = req.user.id;
  const { name, phone } = req.body;

  const sql = 'UPDATE users SET name = ?, phone = ? WHERE id = ?';
  db.run(sql, [name, phone, userId], function(err) {
    if (err) {
      return res.status(500).json({ message: '프로필 업데이트에 실패했습니다.' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    res.json({ message: '프로필이 업데이트되었습니다.' });
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
  db.get('SELECT password FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    bcrypt.compare(currentPassword, user.password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ message: '비밀번호 확인 중 오류가 발생했습니다.' });
      }

      if (!isMatch) {
        return res.status(400).json({ message: '현재 비밀번호가 올바르지 않습니다.' });
      }

      // 새 비밀번호 해시화
      bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
        if (err) {
          return res.status(500).json({ message: '비밀번호 암호화 오류가 발생했습니다.' });
        }

        // 비밀번호 업데이트
        db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId], function(err) {
          if (err) {
            return res.status(500).json({ message: '비밀번호 변경에 실패했습니다.' });
          }

          res.json({ message: '비밀번호가 변경되었습니다.' });
        });
      });
    });
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

module.exports = {
  register,
  login,
  adminLogin,
  verifyAdminPassword,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  verifyEmail
}; 