console.log('=== [실행 중인 server.js] ===');
console.log(__filename);
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const WebSocket = require('ws');
require('dotenv').config();

// MongoDB 연결
const connectMongoDB = require('./config/mongodb');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);

// MongoDB 연결 초기화
connectMongoDB().then(async () => {
  console.log('MongoDB 연결 완료, 서버 시작 중...');
  
  // ExportedFile 모델 테스트
  try {
    const ExportedFile = require('./models/ExportedFile');
    const count = await ExportedFile.countDocuments();
    console.log('✅ ExportedFile 모델 로드 성공, 현재 저장된 파일 수:', count);
  } catch (error) {
    console.error('❌ ExportedFile 모델 로드 실패:', error);
  }
}).catch(err => {
  console.error('MongoDB 연결 실패:', err);
  process.exit(1);
});

// 일반 WebSocket 서버 추가 (ws://localhost:3000/ws 요청 처리)
const wss = new WebSocket.Server({ 
  server,
  path: '/ws'
});

// 일반 WebSocket 연결 처리
wss.on('connection', (ws) => {
  console.log('일반 WebSocket 연결됨:', ws.url);
  
  ws.on('message', (message) => {
    console.log('일반 WebSocket 메시지 수신:', message.toString());
    // 에코 응답
    ws.send(JSON.stringify({ 
      type: 'echo', 
      message: message.toString(),
      timestamp: new Date().toISOString()
    }));
  });
  
  ws.on('close', () => {
    console.log('일반 WebSocket 연결 해제됨');
  });
  
  ws.on('error', (error) => {
    console.error('일반 WebSocket 오류:', error);
  });
});

const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      // origin이 없거나 허용된 도메인인 경우
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('Socket.IO CORS 차단된 도메인:', origin);
        callback(new Error('CORS 정책에 의해 차단됨'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },
  allowEIO3: true,
  transports: ['polling', 'websocket'],
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e8,
  allowUpgrades: true
});

// CORS 설정
const allowedOrigins = [
  'http://localhost:3000',
  'https://admore-frontend.cloudtype.app', // CloudType 프론트엔드 도메인
  'https://web-admore-react-frontend-me83wyv0a5a64d5a.sel5.cloudtype.app', // CloudType 프론트엔드 도메인
  process.env.FRONTEND_URL, // 환경변수로 프론트엔드 URL 설정
  process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [] // 여러 도메인 허용
].filter(Boolean).flat();

console.log('허용된 CORS 도메인:', allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    // origin이 없거나 허용된 도메인인 경우
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS 차단된 도메인:', origin);
      callback(new Error('CORS 정책에 의해 차단됨'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 정적 파일 제공
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB 연결 초기화 후 라우트 로드
// connectMongoDB().then(() => { // 이 부분은 위에서 처리되었으므로 제거
//   console.log('MongoDB 연결 완료, 서버 시작 중...');
  
  // 라우트 로드 (MongoDB 연결 후)
  const authRoutes = require('./routes/auth');
  const userRoutes = require('./routes/users');
  const productRoutes = require('./routes/products');
  const orderRoutes = require('./routes/orders');
  const reviewRoutes = require('./routes/reviews');
  const categoryRoutes = require('./routes/categories');
  const tagRoutes = require('./routes/tags');
  const couponRoutes = require('./routes/coupons');
  const customerServiceRoutes = require('./routes/customerService');

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/tags', tagRoutes);
  app.use('/api/coupons', couponRoutes);
  app.use('/api/customer-service', customerServiceRoutes);

// }); // 이 부분은 위에서 처리되었으므로 제거

// WebSocket 연결 관리
const connectedUsers = new Map(); // socketId -> userEmail
const userSockets = new Map(); // userEmail -> socketId

// MongoDB 모델 import
const ChatMessage = require('./models/ChatMessage');
const ExportedFile = require('./models/ExportedFile');

// 중복 메시지 전송 방지를 위한 메모리 캐시
const recentMessages = new Map();

// 메시지 처리 함수
async function processMessage(userEmail, messageData, socket) {
  const { message, type, inquiryType, productInfo, paymentInfo, file, fileName, fileType } = messageData;
  
  try {
    // MongoDB에 메시지 저장
    const chatMessage = new ChatMessage({
      userId: userEmail,
      user: userEmail,
      message,
      type,
      timestamp: new Date(),
      productInfo: productInfo || '',
      file: file || '',
      fileName: fileName || '',
      fileType: fileType || ''
    });

    const savedMessage = await chatMessage.save();
    console.log('✅ MongoDB에 메시지 저장 완료:', savedMessage);

    // 중복 메시지 전송 방지: 같은 내용의 메시지가 2초 이내에 전송되면 무시
    const messageKey = `${userEmail}_${message}_${type}`;
    const now = Date.now();
    
    if (recentMessages.has(messageKey)) {
      const lastTime = recentMessages.get(messageKey);
      if (now - lastTime < 2000) { // 2초 이내
        console.log('🔄 중복 메시지 전송 방지:', message);
        return;
      }
    }
    
    // 메시지 키와 시간 저장
    recentMessages.set(messageKey, now);
    
    // 5초 후 메시지 키 제거 (메모리 정리)
    setTimeout(() => {
      recentMessages.delete(messageKey);
    }, 5000);

    // 메시지 타입에 따라 적절한 대상에게 전송
    if (type === 'admin') {
      // 관리자 메시지는 특정 유저에게만 전송
      socket.broadcast.emit('new_message', savedMessage);
      console.log(`관리자 메시지 전송: ${userEmail} -> ${message}`);
    } else {
      // 사용자 메시지는 모든 클라이언트에게 전송
      io.emit('new_message', savedMessage);
      console.log(`사용자 메시지 전송: ${userEmail} -> ${message}`);
    }
    
    console.log(`연결된 클라이언트 수: ${io.engine.clientsCount}`);
  } catch (error) {
    console.error('❌ 메시지 저장 실패:', error);
    socket.emit('message_error', { error: '메시지 저장에 실패했습니다.' });
  }
}

// WebSocket 이벤트 핸들러
io.on('connection', (socket) => {
  console.log('새로운 클라이언트 연결:', socket.id);
  console.log('현재 연결된 클라이언트 수:', io.engine.clientsCount);
  
  // 연결 오류 처리
  socket.on('error', (error) => {
    console.error('소켓 오류:', error);
  });
  
  // 연결 시도 실패 처리
  socket.on('connect_error', (error) => {
    console.error('연결 오류:', error);
  });

  // 사용자 로그인
  socket.on('user_login', (userEmail) => {
    connectedUsers.set(socket.id, userEmail);
    userSockets.set(userEmail, socket.id);
    console.log(`사용자 로그인: ${userEmail}`);
    
    // 관리자에게 새 사용자 알림 (admin_room에 있는 관리자들에게만)
    socket.to('admin_room').emit('user_connected', userEmail);
    
    // 모든 클라이언트에게도 알림 (관리자 페이지에서 감지할 수 있도록)
    io.emit('user_connected', userEmail);
  });

  // 관리자 로그인
  socket.on('admin_login', () => {
    console.log('관리자 로그인');
    socket.join('admin_room');
  });

  // 메시지 전송
  socket.on('send_message', async (messageData) => {
    console.log('서버에서 메시지 수신:', messageData);
    try {
      const { userEmail, message, type, inquiryType, productInfo, paymentInfo, file, fileName, fileType } = messageData;
      
      console.log('메시지 데이터 파싱:', {
        userEmail,
        message,
        type,
        inquiryType,
        productInfo,
        paymentInfo,
        file: file ? '있음' : '없음',
        fileName,
        fileType
      });
      
      // 메시지 처리 함수 호출
      processMessage(userEmail, messageData, socket);
    } catch (error) {
      console.error('메시지 처리 오류:', error);
      socket.emit('message_error', { error: '메시지 처리에 실패했습니다.' });
    }
  });

  // 메시지 상태 업데이트
  socket.on('update_message_status', async (data) => {
    try {
      const { userEmail, status } = data;
      
      const updateQuery = `
        UPDATE chat_messages 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE user_email = ? AND status != 'closed'
      `;
      
      // db.run(updateQuery, [ // SQLite 제거
      //   status, 
      //   userEmail
      // ], function(err) {
      //   if (err) {
      //     console.error('상태 업데이트 오류:', err);
      //     return;
      //   }
        
      //   // 모든 클라이언트에게 상태 업데이트 알림
      //   io.emit('message_status_updated', { userEmail, status });
      //   console.log(`메시지 상태 업데이트: ${userEmail} -> ${status}`);
      // });
    } catch (error) {
      console.error('상태 업데이트 처리 오류:', error);
    }
  });

  // 연결 해제
  socket.on('disconnect', (reason) => {
    const userEmail = connectedUsers.get(socket.id);
    if (userEmail) {
      connectedUsers.delete(socket.id);
      userSockets.delete(userEmail);
      console.log(`사용자 연결 해제: ${userEmail} (이유: ${reason})`);
      
      // 관리자에게 사용자 연결 해제 알림
      socket.broadcast.emit('user_disconnected', userEmail);
    } else {
      console.log(`알 수 없는 클라이언트 연결 해제: ${socket.id} (이유: ${reason})`);
    }
    console.log('현재 연결된 클라이언트 수:', io.engine.clientsCount);
  });
});

// 라우터 설정
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/tags', require('./routes/tags'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/users', require('./routes/users'));
app.use('/api/customer-service', require('./routes/customerService'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/migration', require('./routes/migration'));

// 채팅 관련 API
app.get('/api/chat/messages', async (req, res) => {
  try {
    const messages = await ChatMessage.find().sort({ timestamp: 1 });
    console.log('✅ 채팅 메시지 조회 완료:', messages.length);
    res.json(messages);
  } catch (error) {
    console.error('❌ 메시지 조회 오류:', error);
    res.status(500).json({ error: '메시지 조회에 실패했습니다.' });
  }
});

// 사용자별 채팅 메시지 조회
app.get('/api/chat/messages/:userEmail', async (req, res) => {
  try {
    const { userEmail } = req.params;
    const messages = await ChatMessage.find({ user: userEmail }).sort({ timestamp: 1 });
    console.log(`✅ ${userEmail} 사용자 메시지 조회 완료:`, messages.length);
    res.json(messages);
  } catch (error) {
    console.error('❌ 사용자별 메시지 조회 오류:', error);
    res.status(500).json({ error: '사용자별 메시지 조회에 실패했습니다.' });
  }
});

// 현재 채팅 중인 유저 목록 가져오기
app.get('/api/chat/active-users', (req, res) => {
  const query = `
    SELECT DISTINCT user, MAX(timestamp) as lastMessageTime
    FROM chat_messages 
    WHERE user != '관리자'
    GROUP BY user
    ORDER BY lastMessageTime DESC
  `;
  
  // db.all(query, [], (err, rows) => { // SQLite 제거
  //   if (err) {
  //     console.error('활성 유저 조회 오류:', err);
  //     return res.status(500).json({ error: '활성 유저 조회에 실패했습니다.' });
  //   }
    
  //   const activeUsers = rows.map(row => ({
  //     email: row.user,
  //     lastMessageTime: row.lastMessageTime,
  //     isOnline: connectedUsers.has(row.user) || userSockets.has(row.user)
  //   }));
    
  //   res.json(activeUsers);
  // });
});

// 모든 메시지 삭제 API
app.delete('/api/chat/messages/clear', (req, res) => {
  const query = `DELETE FROM chat_messages`;
  
  // db.run(query, [], function(err) { // SQLite 제거
  //   if (err) {
  //     console.error('메시지 삭제 오류:', err);
  //     return res.status(500).json({ error: '메시지 삭제에 실패했습니다.' });
  //   }
    
  //   console.log(`모든 메시지 삭제 완료: ${this.changes}개 메시지 삭제됨`);
  //   res.json({ message: '모든 메시지가 삭제되었습니다.', deletedCount: this.changes });
  // });
});

// 특정 유저의 채팅 메시지 삭제 API (구버전 SQLite 코드 제거됨)

// 채팅 메시지를 MongoDB에 저장하는 함수
const saveChatMessagesToMongoDB = async () => {
  try {
    console.log('🔄 전체 채팅 메시지 저장 시작...');
    
    // MongoDB에서 모든 메시지 조회
    const messages = await ChatMessage.find().sort({ timestamp: 1 });
    console.log('📊 조회된 메시지 수:', messages.length);
    
    if (messages.length === 0) {
      console.log('저장할 채팅 메시지가 없습니다.');
      return;
    }
    
    // 전체 메시지 내용 생성
    let txtContent = '=== 전체 채팅 메시지 ===\n\n';
    messages.forEach(msg => {
      const date = new Date(msg.timestamp).toLocaleString('ko-KR');
      const type = msg.type === 'admin' ? '[관리자]' : '[사용자]';
      const fileInfo = msg.file ? ` (첨부파일: ${msg.fileName})` : '';
      txtContent += `[${date}] ${type} ${msg.user}: ${msg.message}${fileInfo}\n`;
    });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `all_messages_${timestamp}.txt`;
    
    console.log('📝 파일 내용 생성 완료, 크기:', Buffer.byteLength(txtContent, 'utf8'), '바이트');
    
    // MongoDB에 파일 정보 저장
    const exportedFile = new ExportedFile({
      filename,
      content: txtContent,
      size: Buffer.byteLength(txtContent, 'utf8'),
      userEmail: null, // 전체 메시지
      messageCount: messages.length
    });
    
    const savedFile = await exportedFile.save();
    console.log('✅ 전체 채팅 메시지가 MongoDB에 저장되었습니다:', {
      filename,
      id: savedFile._id,
      size: savedFile.size,
      messageCount: savedFile.messageCount
    });
    
  } catch (error) {
    console.error('❌ 메시지 저장 오류:', error);
    throw error;
  }
};

// 채팅 메시지를 파일로 저장하는 API
app.post('/api/chat/messages/export', async (req, res) => {
  try {
    await saveChatMessagesToMongoDB();
    res.json({ 
      message: '채팅 메시지가 파일로 저장되었습니다.',
      location: process.env.NODE_ENV === 'production' ? '/tmp' : path.join(__dirname, 'chat_exports')
    });
  } catch (error) {
    console.error('파일 저장 오류:', error);
    res.status(500).json({ error: '파일 저장에 실패했습니다.' });
  }
});

// 특정 유저의 채팅 메시지를 파일로 저장하는 API
app.post('/api/chat/messages/export/user/:userEmail', async (req, res) => {
  const { userEmail } = req.params;
  
  if (!userEmail) {
    return res.status(400).json({ error: '유저 이메일이 필요합니다.' });
  }
  
  try {
    // MongoDB에서 해당 유저의 메시지 조회
    const messages = await ChatMessage.find({ user: userEmail }).sort({ timestamp: 1 });
    
    if (messages.length === 0) {
      return res.status(404).json({ error: `${userEmail}의 채팅 메시지를 찾을 수 없습니다.` });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `user_${userEmail.replace(/[@.]/g, '_')}_${timestamp}.txt`;
    
    // TXT 파일 내용 생성
    let txtContent = `=== ${userEmail} 채팅 메시지 ===\n\n`;
    messages.forEach(msg => {
      const date = new Date(msg.timestamp).toLocaleString('ko-KR');
      const type = msg.type === 'admin' ? '[관리자]' : '[사용자]';
      const fileInfo = msg.file ? ` (첨부파일: ${msg.fileName})` : '';
      txtContent += `[${date}] ${type} ${msg.user}: ${msg.message}${fileInfo}\n`;
    });
    
    // MongoDB에 파일 정보 저장
    const exportedFile = new ExportedFile({
      filename,
      content: txtContent,
      size: Buffer.byteLength(txtContent, 'utf8'),
      userEmail: userEmail,
      messageCount: messages.length
    });
    
    await exportedFile.save();
    
    console.log(`✅ 유저 ${userEmail}의 메시지가 MongoDB에 저장되었습니다: ${filename}`);
    res.json({ 
      message: `${userEmail}의 채팅 메시지가 MongoDB에 저장되었습니다.`,
      filename: filename,
      messageCount: messages.length
    });
  } catch (error) {
    console.error('파일 저장 오류:', error);
    res.status(500).json({ error: '파일 저장에 실패했습니다.' });
  }
});

// 특정 유저의 채팅 메시지 삭제 API
app.delete('/api/chat/messages/user/:userEmail', async (req, res) => {
  const { userEmail } = req.params;
  
  if (!userEmail) {
    return res.status(400).json({ error: '유저 이메일이 필요합니다.' });
  }
  
  try {
    // MongoDB에서 해당 유저의 메시지 삭제
    const deleteResult = await ChatMessage.deleteMany({ user: userEmail });
    
    console.log(`유저 ${userEmail}의 메시지 삭제 완료: ${deleteResult.deletedCount}개`);
    
    res.json({ 
      message: `${userEmail}의 채팅 메시지가 삭제되었습니다.`,
      deletedCount: deleteResult.deletedCount
    });
  } catch (error) {
    console.error('메시지 삭제 오류:', error);
    res.status(500).json({ error: '메시지 삭제에 실패했습니다.' });
  }
});

// 저장된 파일 목록 조회 API (MongoDB 기반)
app.get('/api/chat/messages/exports', async (req, res) => {
  try {
    console.log('🔄 저장된 파일 목록 조회 시작...');
    
    // ExportedFile 모델 확인
    console.log('📡 ExportedFile 모델 확인:', typeof ExportedFile);
    console.log('📡 ExportedFile 모델 메서드:', Object.getOwnPropertyNames(ExportedFile));
    
    // MongoDB에서 저장된 파일 목록 조회
    const files = await ExportedFile.find().sort({ createdAt: -1 });
    console.log('📊 MongoDB에서 조회된 파일 수:', files.length);
    console.log('📁 조회된 파일 상세:', files.map(f => ({ id: f._id, filename: f.filename, size: f.size })));
    
    // 프론트엔드에서 기대하는 형식으로 변환
    const formattedFiles = files.map(file => ({
      name: file.filename,
      size: file.size,
      created: file.createdAt,
      path: file.filename, // MongoDB ID를 사용하여 다운로드
      type: 'txt',
      userEmail: file.userEmail,
      messageCount: file.messageCount
    }));
    
    console.log('✅ 저장된 파일 목록 조회 완료:', formattedFiles.length, '개 파일');
    console.log('📋 변환된 파일 목록:', formattedFiles);
    res.json({ files: formattedFiles });
  } catch (error) {
    console.error('❌ 파일 목록 조회 오류:', error);
    console.error('오류 상세 정보:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ error: '파일 목록 조회에 실패했습니다.' });
  }
});

// 파일 다운로드 API (MongoDB 기반)
app.get('/api/chat/messages/download/:filename', async (req, res) => {
  const { filename } = req.params;
  
  try {
    // MongoDB에서 파일 정보 조회
    const file = await ExportedFile.findOne({ filename });
    
    if (!file) {
      return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    }
    
    // 파일 내용을 응답으로 전송
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(file.content);
    
    console.log('✅ 파일 다운로드 완료:', filename);
  } catch (error) {
    console.error('❌ 파일 다운로드 오류:', error);
    res.status(500).json({ error: '파일 다운로드에 실패했습니다.' });
  }
});

// MongoDB 상태 확인 엔드포인트
app.get('/api/health/mongodb', async (req, res) => {
  try {
    console.log('🔍 MongoDB 상태 확인 요청...');
    
    // MongoDB 연결 상태 확인
    const dbState = mongoose.connection.readyState;
    const dbStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    console.log('📊 MongoDB 연결 상태:', dbStates[dbState]);
    console.log('📊 데이터베이스 이름:', mongoose.connection.name);
    console.log('📊 호스트:', mongoose.connection.host);
    console.log('📊 포트:', mongoose.connection.port);
    
    // ExportedFile 모델 테스트
    let exportedFileCount = 0;
    let exportedFileTest = null;
    
    try {
      exportedFileCount = await ExportedFile.countDocuments();
      console.log('✅ ExportedFile 모델 테스트 성공, 문서 수:', exportedFileCount);
      
      if (exportedFileCount > 0) {
        exportedFileTest = await ExportedFile.findOne();
        console.log('📁 샘플 ExportedFile:', {
          id: exportedFileTest._id,
          filename: exportedFileTest.filename,
          size: exportedFileTest.size,
          createdAt: exportedFileTest.createdAt
        });
      }
    } catch (error) {
      console.error('❌ ExportedFile 모델 테스트 실패:', error);
    }
    
    // ChatMessage 모델 테스트
    let chatMessageCount = 0;
    try {
      chatMessageCount = await ChatMessage.countDocuments();
      console.log('✅ ChatMessage 모델 테스트 성공, 문서 수:', chatMessageCount);
    } catch (error) {
      console.error('❌ ChatMessage 모델 테스트 실패:', error);
    }
    
    res.json({
      message: 'MongoDB 상태 확인 완료',
      mongodb: {
        connectionState: dbStates[dbState],
        databaseName: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port
      },
      models: {
        exportedFile: {
          status: exportedFileTest ? 'working' : 'no_data',
          count: exportedFileCount,
          sample: exportedFileTest ? {
            id: exportedFileTest._id,
            filename: exportedFileTest.filename,
            size: exportedFileTest.size,
            createdAt: exportedFileTest.createdAt
          } : null
        },
        chatMessage: {
          status: 'working',
          count: chatMessageCount
        }
      }
    });
    
  } catch (error) {
    console.error('❌ MongoDB 상태 확인 오류:', error);
    res.status(500).json({ 
      error: 'MongoDB 상태 확인 실패',
      details: error.message 
    });
  }
});

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ 
    message: 'ADMore API 서버가 실행 중입니다.',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      chat: '/api/chat'
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

server.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`API 문서: http://localhost:${PORT}`);
  console.log(`WebSocket 서버가 활성화되었습니다.`);
}); 