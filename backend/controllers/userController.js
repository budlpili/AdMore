const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

      // 사용자 생성
      const sql = `INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)`;
      db.run(sql, [name, email, hashedPassword, phone], function(err) {
        if (err) {
          return res.status(500).json({ message: '사용자 등록에 실패했습니다.' });
        }

        // JWT 토큰 생성
        const token = jwt.sign(
          { id: this.lastID, email, role: 'user' },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.status(201).json({
          message: '사용자 등록이 완료되었습니다.',
          token,
          user: { id: this.lastID, name, email, role: 'user' }
        });
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
        process.env.JWT_SECRET,
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
      process.env.JWT_SECRET,
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

module.exports = {
  register,
  login,
  adminLogin,
  verifyAdminPassword,
  getProfile,
  updateProfile,
  changePassword
}; 