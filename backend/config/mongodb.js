const mongoose = require('mongoose');

const connectMongoDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/admore';
    
    console.log('MongoDB 연결 시도 중...');
    console.log('연결 URI:', mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // 비밀번호 마스킹
    
    await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false
    });
    
    console.log('✅ MongoDB 연결 성공!');
    console.log('데이터베이스:', mongoose.connection.name);
    console.log('호스트:', mongoose.connection.host);
    console.log('포트:', mongoose.connection.port);
    
    // 연결 이벤트 리스너
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB 연결 오류:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB 연결 해제됨');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB 재연결됨');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB 연결 종료됨');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ MongoDB 연결 실패:', error.message);
    process.exit(1);
  }
};

module.exports = connectMongoDB;
