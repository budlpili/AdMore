const sqlite3 = require('sqlite3').verbose();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Category = require('./models/Category');
const Tag = require('./models/Tag');
const Coupon = require('./models/Coupon');
const Order = require('./models/Order');
const Review = require('./models/Review');
const Notice = require('./models/Notice');
const ChatMessage = require('./models/ChatMessage');
const Privacy = require('./models/Privacy');
const Terms = require('./models/Terms');
require('dotenv').config();

// MongoDB 연결
const connectMongoDB = require('./config/mongodb');

// SQLite 데이터베이스 연결
const db = new sqlite3.Database('./admore.db');

async function completeMigration() {
  try {
    console.log('MongoDB 연결 중...');
    await connectMongoDB();
    console.log('MongoDB 연결 성공!');

    // ID 매핑 테이블 생성
    const idMapping = {
      users: {},
      products: {},
      categories: {},
      tags: {}
    };

    // 1. 사용자 ID 매핑
    console.log('\n=== 사용자 ID 매핑 생성 ===');
    const users = await User.find();
    for (const user of users) {
      const sqliteUser = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM users WHERE email = ?", [user.email], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      if (sqliteUser) {
        idMapping.users[sqliteUser.id] = user._id.toString();
        console.log(`사용자 ID 매핑: ${sqliteUser.id} -> ${user._id}`);
      }
    }

    // 2. 상품 ID 매핑
    console.log('\n=== 상품 ID 매핑 생성 ===');
    const products = await Product.find();
    for (const product of products) {
      const sqliteProduct = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM products WHERE name = ?", [product.name], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      if (sqliteProduct) {
        idMapping.products[sqliteProduct.id] = product._id.toString();
        console.log(`상품 ID 매핑: ${sqliteProduct.id} -> ${product._id}`);
      }
    }

    // 3. 카테고리 ID 매핑
    console.log('\n=== 카테고리 ID 매핑 생성 ===');
    const categories = await Category.find();
    for (const category of categories) {
      const sqliteCategory = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM categories WHERE name = ?", [category.name], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      if (sqliteCategory) {
        idMapping.categories[sqliteCategory.id] = category._id.toString();
        console.log(`카테고리 ID 매핑: ${sqliteCategory.id} -> ${category._id}`);
      }
    }

    // 4. 태그 ID 매핑
    console.log('\n=== 태그 ID 매핑 생성 ===');
    const tags = await Tag.find();
    for (const tag of tags) {
      const sqliteTag = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM tags WHERE name = ?", [tag.name], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      if (sqliteTag) {
        idMapping.tags[sqliteTag.id] = tag._id.toString();
        console.log(`태그 ID 매핑: ${sqliteTag.id} -> ${tag._id}`);
      }
    }

    console.log('\n=== ID 매핑 완료 ===');

    // 5. 공지사항 마이그레이션
    console.log('\n=== 공지사항 마이그레이션 시작 ===');
    const notices = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM notices", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const notice of notices) {
      try {
        const noticeData = {
          title: notice.title || '제목 없음',
          content: notice.content || '',
          important: notice.important === 1,
          author: notice.author || '관리자',
          createdAt: notice.createdAt ? new Date(notice.createdAt) : new Date(),
          updatedAt: notice.updatedAt ? new Date(notice.updatedAt) : new Date()
        };

        const existingNotice = await Notice.findOne({ title: noticeData.title });
        if (!existingNotice) {
          const newNotice = new Notice(noticeData);
          await newNotice.save();
          console.log(`✅ 공지사항 마이그레이션 완료: ${noticeData.title}`);
        } else {
          console.log(`⚠️ 공지사항 이미 존재: ${noticeData.title}`);
        }
      } catch (error) {
        console.error(`❌ 공지사항 마이그레이션 실패: ${notice.id}`, error.message);
      }
    }

    // 6. 채팅 메시지 마이그레이션
    console.log('\n=== 채팅 메시지 마이그레이션 시작 ===');
    const chatMessages = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM chat_messages", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const chat of chatMessages) {
      try {
        const chatData = {
          userId: chat.userId ? chat.userId.toString() : 'unknown',
          user: chat.user || 'Unknown User',
          message: chat.message || '',
          timestamp: chat.timestamp ? new Date(chat.timestamp) : new Date(),
          type: chat.type || 'text',
          productInfo: chat.productInfo || '',
          file: chat.file || '',
          fileName: chat.file_name || '',
          fileType: chat.file_type || ''
        };

        const existingChat = await ChatMessage.findOne({ 
          userId: chatData.userId, 
          message: chatData.message,
          timestamp: chatData.timestamp
        });
        if (!existingChat) {
          const newChat = new ChatMessage(chatData);
          await newChat.save();
          console.log(`✅ 채팅 메시지 마이그레이션 완료: ${chat.id}`);
        } else {
          console.log(`⚠️ 채팅 메시지 이미 존재: ${chat.id}`);
        }
      } catch (error) {
        console.error(`❌ 채팅 메시지 마이그레이션 실패: ${chat.id}`, error.message);
      }
    }

    // 7. 개인정보처리방침 마이그레이션
    console.log('\n=== 개인정보처리방침 마이그레이션 시작 ===');
    const privacy = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM privacy", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const item of privacy) {
      try {
        const privacyData = {
          title: item.title || '개인정보처리방침',
          content: item.content || item.text || '',
          version: '1.0',
          effectiveDate: new Date()
        };

        const existingPrivacy = await Privacy.findOne({ title: privacyData.title });
        if (!existingPrivacy) {
          const newPrivacy = new Privacy(privacyData);
          await newPrivacy.save();
          console.log(`✅ 개인정보처리방침 마이그레이션 완료: ${privacyData.title}`);
        } else {
          console.log(`⚠️ 개인정보처리방침 이미 존재: ${privacyData.title}`);
        }
      } catch (error) {
        console.error(`❌ 개인정보처리방침 마이그레이션 실패: ${item.id}`, error.message);
      }
    }

    // 8. 이용약관 마이그레이션
    console.log('\n=== 이용약관 마이그레이션 시작 ===');
    const terms = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM terms", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const term of terms) {
      try {
        const termData = {
          title: term.title || '이용약관',
          content: term.content || term.text || '',
          version: '1.0',
          effectiveDate: new Date()
        };

        const existingTerm = await Terms.findOne({ title: termData.title });
        if (!existingTerm) {
          const newTerm = new Terms(termData);
          await newTerm.save();
          console.log(`✅ 이용약관 마이그레이션 완료: ${termData.title}`);
        } else {
          console.log(`⚠️ 이용약관 이미 존재: ${termData.title}`);
        }
      } catch (error) {
        console.error(`❌ 이용약관 마이그레이션 실패: ${term.id}`, error.message);
      }
    }

    console.log('\n🎉 완전한 마이그레이션 완료!');

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
  } finally {
    db.close();
    mongoose.connection.close();
    console.log('데이터베이스 연결 종료');
  }
}

// 마이그레이션 실행
completeMigration();



