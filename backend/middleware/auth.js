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

    // temp_token_ 형태의 토큰인 경우 특별 처리
    if (token.startsWith('temp_token_')) {
      console.log('Auth 미들웨어 - 임시 토큰 감지, 기본 사용자 정보 설정');
      
      // 임시 토큰에서 이메일 정보 추출 시도
      let userEmail = 'temp@example.com';
      console.log('Auth 미들웨어 - 전체 토큰:', token);
      
      if (token.includes('_') && token.split('_').length >= 3) {
        const parts = token.split('_');
        console.log('Auth 미들웨어 - 토큰 파트:', parts);
        
        // 마지막 부분에서 이메일 찾기
        for (let i = parts.length - 1; i >= 2; i--) {
          const part = parts[i];
          if (part && part.includes('@')) {
            userEmail = part;
            console.log('Auth 미들웨어 - 임시 토큰에서 이메일 추출:', userEmail);
            break;
          }
        }
      }
      
      req.user = {
        id: 'temp_user_id',
        email: userEmail,
        role: 'user'
      };
      return next();
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