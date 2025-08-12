const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 데이터베이스 파일 경로
const dbPath = path.join(__dirname, '..', 'admore.db');

// SQLite 데이터베이스 연결
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('데이터베이스 연결 오류:', err.message);
  } else {
    console.log('✅ SQLite 데이터베이스 연결 성공!');
    console.log('데이터베이스 경로:', dbPath);
    
    // 데이터베이스 초기화
    initializeDatabase();
  }
});

// 데이터베이스 초기화 함수
function initializeDatabase() {
  db.serialize(() => {
    // 사용자 테이블
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      joinDate TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active',
      role TEXT DEFAULT 'user',
      emailVerified INTEGER DEFAULT 0,
      verifyToken TEXT,
      verifyExpires TEXT,
      lastLogin TEXT
    )`);

    // 상품 테이블
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price TEXT NOT NULL,
      category TEXT NOT NULL,
      image TEXT,
      background TEXT,
      rating REAL DEFAULT 0,
      reviewCount INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active'
    )`);

    // 주문 테이블
    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      productId INTEGER,
      quantity INTEGER DEFAULT 1,
      totalPrice TEXT,
      paymentMethod TEXT,
      status TEXT DEFAULT 'pending',
      orderDate TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users (id),
      FOREIGN KEY (productId) REFERENCES products (id)
    )`);

    // 리뷰 테이블
    db.run(`CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      productId INTEGER,
      rating INTEGER NOT NULL,
      comment TEXT,
      reviewDate TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users (id),
      FOREIGN KEY (productId) REFERENCES products (id)
    )`);

    // 채팅 메시지 테이블
    db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userEmail TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      isUser BOOLEAN DEFAULT 1
    )`);

    console.log('데이터베이스 테이블 초기화 완료');
  });
}

// 기본 관리자 계정 생성 (없는 경우)
function createDefaultAdmin() {
  const bcrypt = require('bcryptjs');
  
  db.get('SELECT * FROM users WHERE email = ?', ['admin@admore.com'], (err, user) => {
    if (err) {
      console.error('관리자 계정 확인 오류:', err);
      return;
    }
    
    if (!user) {
      bcrypt.hash('admin123', 10, (err, hashedPassword) => {
        if (err) {
          console.error('관리자 비밀번호 해시 오류:', err);
          return;
        }
        
        db.run(`INSERT INTO users (name, email, password, role, emailVerified, status) 
                VALUES (?, ?, ?, ?, ?, ?)`, 
                ['관리자', 'admin@admore.com', hashedPassword, 'admin', 1, 'active'],
                function(err) {
                  if (err) {
                    console.error('관리자 계정 생성 오류:', err);
                  } else {
                    console.log('✅ 기본 관리자 계정 생성 완료');
                    console.log('이메일: admin@admore.com');
                    console.log('비밀번호: admin123');
                  }
                });
      });
    } else {
      console.log('기본 관리자 계정이 이미 존재합니다');
    }
  });
}

// 데이터베이스 연결 후 기본 관리자 계정 생성
setTimeout(createDefaultAdmin, 1000);

module.exports = db;
