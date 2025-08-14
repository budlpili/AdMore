const sqlite3 = require('sqlite3').verbose();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
require('dotenv').config();

// MongoDB 연결
const connectMongoDB = require('./config/mongodb');

// SQLite 데이터베이스 연결
const db = new sqlite3.Database('./admore.db');

async function migrateData() {
  try {
    console.log('MongoDB 연결 중...');
    await connectMongoDB();
    console.log('MongoDB 연결 성공!');

    // 1. 사용자 데이터 마이그레이션
    console.log('\n=== 사용자 데이터 마이그레이션 시작 ===');
    const users = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM users", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const user of users) {
      try {
        const userData = {
          name: user.name,
          email: user.email,
          password: user.password,
          phone: user.phone,
          address: user.address,
          role: user.role || 'user',
          emailVerified: user.emailVerified || 0,
          status: user.status || 'active',
          createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
          updatedAt: new Date()
        };

        // 기존 사용자 확인
        const existingUser = await User.findOne({ email: user.email });
        if (!existingUser) {
          const newUser = new User(userData);
          await newUser.save();
          console.log(`✅ 사용자 마이그레이션 완료: ${user.name} (${user.email})`);
        } else {
          console.log(`⚠️ 사용자 이미 존재: ${user.name} (${user.email})`);
        }
      } catch (error) {
        console.error(`❌ 사용자 마이그레이션 실패: ${user.name}`, error.message);
      }
    }

    // 2. 상품 데이터 마이그레이션
    console.log('\n=== 상품 데이터 마이그레이션 시작 ===');
    const products = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM products", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const product of products) {
      try {
        const productData = {
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category || '기타',
          tags: product.tags ? product.tags.split(',').map(tag => tag.trim()) : [],
          image: product.image,
          status: product.status || 'active',
          productNumber: `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: product.createdAt ? new Date(product.createdAt) : new Date(),
          updatedAt: new Date()
        };

        // 기존 상품 확인
        const existingProduct = await Product.findOne({ name: product.name });
        if (!existingProduct) {
          const newProduct = new Product(productData);
          await newProduct.save();
          console.log(`✅ 상품 마이그레이션 완료: ${product.name}`);
        } else {
          console.log(`⚠️ 상품 이미 존재: ${product.name}`);
        }
      } catch (error) {
        console.error(`❌ 상품 마이그레이션 실패: ${product.name}`, error.message);
      }
    }

    // 3. 카테고리 데이터 마이그레이션
    console.log('\n=== 카테고리 데이터 마이그레이션 시작 ===');
    const categories = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM categories", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`카테고리 ${categories.length}개 발견`);

    // 4. 태그 데이터 마이그레이션
    console.log('\n=== 태그 데이터 마이그레이션 시작 ===');
    const tags = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM tags", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`태그 ${tags.length}개 발견`);

    // 5. 쿠폰 데이터 마이그레이션
    console.log('\n=== 쿠폰 데이터 마이그레이션 시작 ===');
    const coupons = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM coupons", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`쿠폰 ${coupons.length}개 발견`);

    console.log('\n🎉 마이그레이션 완료!');
    console.log(`- 사용자: ${users.length}명`);
    console.log(`- 상품: ${products.length}개`);
    console.log(`- 카테고리: ${categories.length}개`);
    console.log(`- 태그: ${tags.length}개`);
    console.log(`- 쿠폰: ${coupons.length}개`);

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
  } finally {
    db.close();
    mongoose.connection.close();
    console.log('데이터베이스 연결 종료');
  }
}

// 마이그레이션 실행
migrateData();
