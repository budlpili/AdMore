const sqlite3 = require('sqlite3').verbose();
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB 연결
const connectMongoDB = require('./config/mongodb');

// SQLite 데이터베이스 연결
const db = new sqlite3.Database('./admore.db');

async function migrateMissingTables() {
  try {
    console.log('MongoDB 연결 중...');
    await connectMongoDB();
    console.log('MongoDB 연결 성공!');

    // 1. 공지사항 데이터 마이그레이션
    console.log('\n=== 공지사항 데이터 마이그레이션 시작 ===');
    const notices = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM notices", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`공지사항 ${notices.length}개 발견`);
    for (const notice of notices) {
      console.log(`- ${notice.title || notice.name || '제목 없음'}`);
    }

    // 2. 개인정보처리방침 데이터 마이그레이션
    console.log('\n=== 개인정보처리방침 데이터 마이그레이션 시작 ===');
    const privacy = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM privacy", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`개인정보처리방침 ${privacy.length}개 발견`);
    for (const item of privacy) {
      console.log(`- ${item.title || item.name || '제목 없음'}`);
    }

    // 3. 이용약관 데이터 마이그레이션
    console.log('\n=== 이용약관 데이터 마이그레이션 시작 ===');
    const terms = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM terms", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`이용약관 ${terms.length}개 발견`);
    for (const term of terms) {
      console.log(`- ${term.title || term.name || '제목 없음'}`);
    }

    // 4. 채팅 메시지 데이터 마이그레이션
    console.log('\n=== 채팅 메시지 데이터 마이그레이션 시작 ===');
    const chatMessages = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM chat_messages", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`채팅 메시지 ${chatMessages.length}개 발견`);
    if (chatMessages.length > 0) {
      console.log(`- 첫 번째 메시지: ${chatMessages[0].message || chatMessages[0].text || '내용 없음'}`);
      console.log(`- 마지막 메시지: ${chatMessages[chatMessages.length - 1].message || chatMessages[chatMessages.length - 1].text || '내용 없음'}`);
    }

    // 5. 쿠폰 관리 데이터 마이그레이션
    console.log('\n=== 쿠폰 관리 데이터 마이그레이션 시작 ===');
    const couponManagement = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM coupon_management", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`쿠폰 관리 ${couponManagement.length}개 발견`);
    for (const item of couponManagement) {
      console.log(`- ${item.name || item.title || '제목 없음'}`);
    }

    // 6. 쿠폰 발송 데이터 마이그레이션
    console.log('\n=== 쿠폰 발송 데이터 마이그레이션 시작 ===');
    const couponSends = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM coupon_sends", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`쿠폰 발송 ${couponSends.length}개 발견`);
    if (couponSends.length > 0) {
      console.log(`- 첫 번째 발송: ${couponSends[0].userEmail || couponSends[0].email || '이메일 없음'}`);
      console.log(`- 마지막 발송: ${couponSends[couponSends.length - 1].userEmail || couponSends[couponSends.length - 1].email || '이메일 없음'}`);
    }

    console.log('\n🎉 누락된 테이블 데이터 확인 완료!');
    console.log(`- 공지사항: ${notices.length}개`);
    console.log(`- 개인정보처리방침: ${privacy.length}개`);
    console.log(`- 이용약관: ${terms.length}개`);
    console.log(`- 채팅 메시지: ${chatMessages.length}개`);
    console.log(`- 쿠폰 관리: ${couponManagement.length}개`);
    console.log(`- 쿠폰 발송: ${couponSends.length}개`);

    // 데이터 구조 확인
    if (notices.length > 0) {
      console.log('\n=== 공지사항 테이블 구조 ===');
      const noticeColumns = await new Promise((resolve, reject) => {
        db.all("PRAGMA table_info(notices)", [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      noticeColumns.forEach(col => {
        console.log(`- ${col.name}: ${col.type}`);
      });
    }

    if (chatMessages.length > 0) {
      console.log('\n=== 채팅 메시지 테이블 구조 ===');
      const chatColumns = await new Promise((resolve, reject) => {
        db.all("PRAGMA table_info(chat_messages)", [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      chatColumns.forEach(col => {
        console.log(`- ${col.name}: ${col.type}`);
      });
    }

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
  } finally {
    db.close();
    mongoose.connection.close();
    console.log('데이터베이스 연결 종료');
  }
}

// 마이그레이션 실행
migrateMissingTables();






