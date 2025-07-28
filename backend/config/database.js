const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = path.resolve(__dirname, '..', 'admore.db');

// 데이터베이스 연결
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('데이터베이스 연결 오류:', err.message);
  } else {
    console.log('SQLite 데이터베이스에 연결되었습니다.');
    initializeTables();
  }
});

// 테이블 초기화 함수
const initializeTables = () => {
  // 사용자 테이블
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    joinDate TEXT DEFAULT (datetime('now', 'localtime')),
    status TEXT DEFAULT 'active',
    role TEXT DEFAULT 'user',
    lastLogin TEXT,
    orderCount INTEGER DEFAULT 0,
    totalSpent INTEGER DEFAULT 0
  )`);

  // 상품 테이블
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    discountRate INTEGER DEFAULT 0,
    originalPrice INTEGER,
    price TEXT NOT NULL,
    price1Day INTEGER,
    price7Days INTEGER,
    price30Days INTEGER,
    category TEXT NOT NULL,
    image TEXT,
    background TEXT,
    clickCount INTEGER DEFAULT 0,
    popular BOOLEAN DEFAULT 0,
    addedDate TEXT DEFAULT (datetime('now', 'localtime')),
    viewedDate TEXT,
    rating REAL DEFAULT 0,
    reviewCount INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    stock INTEGER DEFAULT 0,
    tags TEXT,
    detailedDescription TEXT,
    specifications TEXT,
    productNumber TEXT,
    createdAt TEXT DEFAULT (datetime('now', 'localtime')),
    updatedAt TEXT DEFAULT (datetime('now', 'localtime'))
  )`);

  // 주문 테이블
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId TEXT UNIQUE NOT NULL,
    userId INTEGER,
    productId INTEGER,
    product TEXT NOT NULL,
    detail TEXT,
    quantity INTEGER DEFAULT 1,
    price TEXT NOT NULL,
    originalPrice TEXT,
    discountPrice TEXT,
    request TEXT,
    date TEXT DEFAULT (datetime('now', 'localtime')),
    paymentDate TEXT,
    status TEXT DEFAULT '대기중',
    review TEXT DEFAULT '리뷰 작성하기',
    image TEXT,
    paymentMethod TEXT,
    refundStatus TEXT,
    confirmStatus TEXT DEFAULT '구매확정전',
    paymentNumber TEXT,
    userName TEXT,
    userEmail TEXT,
    productNumber TEXT,
    FOREIGN KEY (userId) REFERENCES users (id),
    FOREIGN KEY (productId) REFERENCES products (id)
  )`);

  // 리뷰 테이블
  db.run(`CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productId INTEGER NOT NULL,
    userEmail TEXT NOT NULL,
    rating INTEGER NOT NULL,
    content TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now', 'localtime')),
    orderId TEXT,
    FOREIGN KEY (productId) REFERENCES products (id)
  )`);

  // 카테고리 테이블
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    type TEXT DEFAULT 'custom',
    createdAt TEXT DEFAULT (datetime('now', 'localtime')),
    updatedAt TEXT DEFAULT (datetime('now', 'localtime'))
  )`);

  // 태그 테이블
  db.run(`CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    type TEXT DEFAULT 'custom',
    createdAt TEXT DEFAULT (datetime('now', 'localtime')),
    updatedAt TEXT DEFAULT (datetime('now', 'localtime'))
  )`);

  // 쿠폰 테이블
  db.run(`CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    discountRate INTEGER NOT NULL,
    maxDiscount INTEGER,
    minAmount INTEGER,
    expire TEXT NOT NULL,
    isUsed BOOLEAN DEFAULT 0,
    usedBy INTEGER,
    usedAt TEXT,
    FOREIGN KEY (usedBy) REFERENCES users (id)
  )`);

  // 채팅 메시지 테이블
  db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    user TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TEXT DEFAULT (datetime('now', 'localtime')),
    type TEXT DEFAULT 'user',
    productInfo TEXT,
    FOREIGN KEY (userId) REFERENCES users (id)
  )`);

  console.log('데이터베이스 테이블이 초기화되었습니다.');
  
  // productNumber 컬럼이 없는 경우 추가
  db.run(`ALTER TABLE products ADD COLUMN productNumber TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('productNumber 컬럼 추가 오류:', err);
    } else if (!err) {
      console.log('productNumber 컬럼이 추가되었습니다.');
    }
  });
  
  // 컬럼 존재 여부 확인
  db.all("PRAGMA table_info(products)", [], (err, columns) => {
    if (err) {
      console.error('테이블 스키마 조회 에러:', err);
    } else {
      console.log('products 테이블 컬럼 목록:', columns.map(col => col.name));
      const hasProductNumber = columns.some(col => col.name === 'productNumber');
      console.log('productNumber 컬럼 존재 여부:', hasProductNumber);
    }
  });
  
  // 기본 관리자 계정 생성
  createDefaultAdmin();
  
  // 기본 상품 데이터 생성
  createDefaultProducts();
};

// 기본 관리자 계정 생성
const createDefaultAdmin = () => {
  const bcrypt = require('bcryptjs');
  
  // 관리자 계정이 있는지 확인
  db.get('SELECT * FROM users WHERE email = ?', ['admin@admore.com'], (err, admin) => {
    if (err) {
      console.error('관리자 계정 확인 오류:', err);
      return;
    }
    
    if (!admin) {
      // 관리자 계정 생성
      bcrypt.hash('admin123', 10, (err, hashedPassword) => {
        if (err) {
          console.error('관리자 비밀번호 암호화 오류:', err);
          return;
        }
        
        const sql = `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`;
        db.run(sql, ['관리자', 'admin@admore.com', hashedPassword, 'admin'], function(err) {
          if (err) {
            console.error('관리자 계정 생성 오류:', err);
          } else {
            console.log('기본 관리자 계정이 생성되었습니다.');
            console.log('이메일: admin@admore.com');
            console.log('비밀번호: admin123');
          }
        });
      });
    } else {
      console.log('관리자 계정이 이미 존재합니다.');
    }
  });
};

// 기본 상품 데이터 생성
const createDefaultProducts = () => {
  // 상품이 있는지 확인
  db.get('SELECT COUNT(*) as count FROM products', (err, result) => {
    if (err) {
      console.error('상품 개수 확인 오류:', err);
      return;
    }
    
    if (result.count === 0) {
      const defaultProducts = [
        {
          name: '유튜브 마케팅 활성화',
          description: '구독자,조회수,좋아요,수익창출,스트리밍 시청 활성화 관리 해드립니다.',
          discountRate: 16,
          originalPrice: 6000,
          price: '5,000원',
          price1Day: 5000,
          price7Days: 30000,
          price30Days: 100000,
          category: '유튜브',
          image: 'youtube.png',
          background: '/images/product_01.png',
          clickCount: 1800,
          rating: 4.7,
          reviewCount: 2671,
          stock: 100,
          tags: '구독자,조회수,좋아요,수익창출,스트리밍 시청 활성화 관리',
          detailedDescription: '유튜브 채널의 구독자 수, 조회수, 좋아요, 수익창출, 스트리밍 시청 활성화를 종합적으로 관리해드리는 서비스입니다.',
          specifications: '서비스 기간: 30일\n처리 시간: 24-48시간\n안전 보장: 100%'
        },
        {
          name: '페이스북 팔로워 1000명',
          description: '진짜 팔로워로 페이지 신뢰도 상승!',
          discountRate: 10,
          originalPrice: 55000,
          price: '50,000원',
          price1Day: 8000,
          price7Days: 45000,
          price30Days: 150000,
          category: '페이스북',
          image: 'facebook.png',
          background: '/images/product_02.png',
          clickCount: 1200,
          rating: 4.5,
          reviewCount: 1200,
          stock: 50,
          tags: '팔로워,조회수,좋아요,수익창출,스트리밍 시청 활성화 관리',
          detailedDescription: '페이스북 페이지의 팔로워를 1000명 증가시켜 페이지의 신뢰도와 영향력을 높여드립니다.',
          specifications: '서비스 기간: 7일\n처리 시간: 12-24시간\n안전 보장: 100%'
        },
        {
          name: '페이스북 좋아요 2000개',
          description: '페이지/게시물 좋아요 빠른 증가!',
          discountRate: 20,
          originalPrice: 50000,
          price: '40,000원',
          price1Day: 7000,
          price7Days: 35000,
          price30Days: 120000,
          category: '페이스북',
          image: 'facebook.png',
          background: '/images/product_03.png',
          clickCount: 1100,
          rating: 4.3,
          reviewCount: 800,
          stock: 75,
          tags: '팔로워,조회수,좋아요,수익창출,스트리밍 시청 활성화 관리',
          detailedDescription: '페이스북 페이지나 게시물에 좋아요를 2000개 증가시켜 인기도를 높여드립니다.',
          specifications: '서비스 기간: 5일\n처리 시간: 6-12시간\n안전 보장: 100%'
        },
        {
          name: '인스타그램 팔로워 500명',
          description: '실제 유저 기반 팔로워 증가!',
          discountRate: 25,
          originalPrice: 40000,
          price: '30,000원',
          price1Day: 6000,
          price7Days: 30000,
          price30Days: 100000,
          category: '인스타그램',
          image: 'instagram.png',
          background: '/images/product_04.png',
          clickCount: 950,
          rating: 4.8,
          reviewCount: 1500,
          stock: 200,
          tags: '팔로워,조회수,좋아요,수익창출,스트리밍 시청 활성화 관리',
          detailedDescription: '인스타그램 계정에 실제 유저 기반의 팔로워를 500명 증가시켜 계정의 영향력을 높여드립니다.',
          specifications: '서비스 기간: 10일\n처리 시간: 24-48시간\n안전 보장: 100%'
        },
        {
          name: '인스타그램 팔로워 500명',
          description: '실제 유저 기반 팔로워 증가!',
          discountRate: 25,
          originalPrice: 40000,
          price: '30,000원',
          price1Day: 6000,
          price7Days: 30000,
          price30Days: 100000,
          category: '인스타그램',
          image: 'instagram.png',
          background: '/images/product_05.png',
          clickCount: 950,
          rating: 4.8,
          reviewCount: 1500,
          stock: 150,
          tags: '팔로워,조회수,좋아요,수익창출,스트리밍 시청 활성화 관리',
          detailedDescription: '인스타그램 계정에 실제 유저 기반의 팔로워를 500명 증가시켜 계정의 영향력을 높여드립니다.',
          specifications: '서비스 기간: 10일\n처리 시간: 24-48시간\n안전 보장: 100%'
        },
        {
          name: '인스타그램 팔로워 500명',
          description: '실제 유저 기반 팔로워 증가!',
          discountRate: 25,
          originalPrice: 40000,
          price: '30,000원',
          price1Day: 6000,
          price7Days: 30000,
          price30Days: 100000,
          category: '인스타그램',
          image: 'instagram.png',
          background: '/images/product_06.png',
          clickCount: 950,
          rating: 4.8,
          reviewCount: 1500,
          stock: 120,
          tags: '팔로워,조회수,좋아요,수익창출,스트리밍 시청 활성화 관리',
          detailedDescription: '인스타그램 계정에 실제 유저 기반의 팔로워를 500명 증가시켜 계정의 영향력을 높여드립니다.',
          specifications: '서비스 기간: 10일\n처리 시간: 24-48시간\n안전 보장: 100%'
        },
        {
          name: '인스타그램 팔로워 500명',
          description: '실제 유저 기반 팔로워 증가!',
          discountRate: 25,
          originalPrice: 40000,
          price: '30,000원',
          price1Day: 6000,
          price7Days: 30000,
          price30Days: 100000,
          category: '인스타그램',
          image: 'instagram.png',
          background: '/images/product_07.png',
          clickCount: 950,
          rating: 4.8,
          reviewCount: 1500,
          stock: 80,
          tags: '팔로워,조회수,좋아요,수익창출,스트리밍 시청 활성화 관리',
          detailedDescription: '인스타그램 계정에 실제 유저 기반의 팔로워를 500명 증가시켜 계정의 영향력을 높여드립니다.',
          specifications: '서비스 기간: 10일\n처리 시간: 24-48시간\n안전 보장: 100%'
        },
        {
          name: '인스타그램 팔로워 500명',
          description: '실제 유저 기반 팔로워 증가!',
          discountRate: 25,
          originalPrice: 40000,
          price: '30,000원',
          price1Day: 6000,
          price7Days: 30000,
          price30Days: 100000,
          category: '인스타그램',
          image: 'instagram.png',
          background: '/images/product_08.png',
          clickCount: 950,
          rating: 4.8,
          reviewCount: 1500,
          stock: 90,
          tags: '팔로워,조회수,좋아요,수익창출,스트리밍 시청 활성화 관리',
          detailedDescription: '인스타그램 계정에 실제 유저 기반의 팔로워를 500명 증가시켜 계정의 영향력을 높여드립니다.',
          specifications: '서비스 기간: 10일\n처리 시간: 24-48시간\n안전 보장: 100%'
        },
        {
          name: '인스타그램 팔로워 500명',
          description: '실제 유저 기반 팔로워 증가!',
          discountRate: 25,
          originalPrice: 40000,
          price: '30,000원',
          price1Day: 6000,
          price7Days: 30000,
          price30Days: 100000,
          category: '인스타그램',
          image: 'instagram.png',
          background: '/images/product_09.png',
          clickCount: 950,
          rating: 4.8,
          reviewCount: 1500,
          stock: 60,
          tags: '팔로워,조회수,좋아요,수익창출,스트리밍 시청 활성화 관리',
          detailedDescription: '인스타그램 계정에 실제 유저 기반의 팔로워를 500명 증가시켜 계정의 영향력을 높여드립니다.',
          specifications: '서비스 기간: 10일\n처리 시간: 24-48시간\n안전 보장: 100%'
        },
        {
          name: '인스타그램 팔로워 500명',
          description: '실제 유저 기반 팔로워 증가!',
          discountRate: 25,
          originalPrice: 40000,
          price: '30,000원',
          price1Day: 6000,
          price7Days: 30000,
          price30Days: 100000,
          category: '인스타그램',
          image: 'instagram.png',
          background: '/images/product_10.png',
          clickCount: 950,
          rating: 4.8,
          reviewCount: 1500,
          stock: 70,
          tags: '팔로워,조회수,좋아요,수익창출,스트리밍 시청 활성화 관리',
          detailedDescription: '인스타그램 계정에 실제 유저 기반의 팔로워를 500명 증가시켜 계정의 영향력을 높여드립니다.',
          specifications: '서비스 기간: 10일\n처리 시간: 24-48시간\n안전 보장: 100%'
        }
      ];
      
      defaultProducts.forEach(product => {
        const sql = `INSERT INTO products (
          name, description, discountRate, originalPrice, price, price1Day, price7Days, price30Days, category, 
          image, background, clickCount, rating, reviewCount, stock, tags, 
          detailedDescription, specifications
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const params = [
          product.name, product.description, product.discountRate, product.originalPrice,
          product.price, product.price1Day, product.price7Days, product.price30Days, product.category, 
          product.image, product.background, product.clickCount, product.rating, product.reviewCount, product.stock,
          product.tags, product.detailedDescription, product.specifications
        ];
        
        db.run(sql, params, function(err) {
          if (err) {
            console.error('기본 상품 생성 오류:', err);
          }
        });
      });
      
      console.log('기본 상품 데이터가 생성되었습니다.');
    } else {
      console.log('상품 데이터가 이미 존재합니다.');
    }
  });
};

module.exports = db; 