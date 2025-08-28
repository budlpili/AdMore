// MongoDB 데이터베이스 설정
const mongoose = require('mongoose');

// MongoDB 연결 함수
const connectToMongoDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/admore';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB 연결 성공!');
    return true;
  } catch (error) {
    console.error('❌ MongoDB 연결 실패:', error);
    return false;
  }
};

// MongoDB 모델들을 export
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const Review = require('../models/Review');
const Category = require('../models/Category');
const Tag = require('../models/Tag');
const Notice = require('../models/Notice'); // Added
const ChatMessage = require('../models/ChatMessage'); // Added
const ExportedFile = require('../models/ExportedFile'); // Added
const Privacy = require('../models/Privacy'); // Added
const Terms = require('../models/Terms'); // Added

module.exports = {
  connectToMongoDB,
  Product,
  User,
  Order,
  Coupon,
  Review,
  Category,
  Tag,
  Notice, // Added
  ChatMessage, // Added
  ExportedFile, // Added
  Privacy, // Added
  Terms // Added
};
