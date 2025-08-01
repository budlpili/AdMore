const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('Auth 미들웨어 - 요청 헤더:', req.header('Authorization'));
    console.log('Auth 미들웨어 - 추출된 토큰:', token ? token.substring(0, 20) + '...' : '없음');
    
    if (!token) {
      console.log('Auth 미들웨어 - 토큰이 없음');
      return res.status(401).json({ message: '인증 토큰이 없습니다.' });
    }

    console.log('Auth 미들웨어 - JWT_SECRET:', process.env.JWT_SECRET ? '설정됨' : '설정되지 않음');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'admore_jwt_secret_key_2024');
    console.log('Auth 미들웨어 - 토큰 검증 성공:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('Auth 미들웨어 - 토큰 검증 실패:', error.message);
    res.status(401).json({ message: '유효하지 않은 토큰입니다.', error: error.message });
  }
};

const adminAuth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: '인증 토큰이 없습니다.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
};

module.exports = { auth, adminAuth }; 