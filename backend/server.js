console.log('=== [실행 중인 server.js] ===');
console.log(__filename);
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// 데이터베이스 연결
require('./config/database');

const app = express();

// CORS 설정
app.use(cors({
  origin: [
    'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 
    'http://localhost:3003', 'http://localhost:3004', 'http://localhost:3005',
    'http://localhost:3006', 'http://localhost:3007', 'http://localhost:3008',
    'http://localhost:3009', 'http://localhost:3010',
    'http://localhost:63469', 'http://127.0.0.1:63469',
    'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3002', 
    'http://127.0.0.1:3003', 'http://127.0.0.1:3004', 'http://127.0.0.1:3005',
    'http://127.0.0.1:3006', 'http://127.0.0.1:3007', 'http://127.0.0.1:3008',
    'http://127.0.0.1:3009', 'http://127.0.0.1:3010'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 미들웨어 설정
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 정적 파일 제공
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 라우터 설정
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/tags', require('./routes/tags'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/users', require('./routes/users'));

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ 
    message: 'ADMore API 서버가 실행 중입니다.',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders'
    }
  });
});

// 404 에러 핸들러
app.use('*', (req, res) => {
  res.status(404).json({ message: '요청한 엔드포인트를 찾을 수 없습니다.' });
});

// 전역 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`API 문서: http://localhost:${PORT}`);
}); 