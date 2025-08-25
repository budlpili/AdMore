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

const app = express();
const server = http.createServer(app);

// MongoDB 연결 초기화
connectMongoDB().then(() => {
  console.log('MongoDB 연결 완료, 서버 시작 중...');
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
    
    // 관리자에게 새 사용자 알림
    socket.broadcast.emit('user_connected', userEmail);
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
      
      // userEmail에서 실제 이메일 추출 (세션 ID에서 타임스탬프 제거)
      const actualEmail = userEmail.includes('_') ? userEmail.split('_')[0] : userEmail;
      
      // 프론트엔드에서 보낸 userEmail이 이미 세션 ID인지 확인
      if (userEmail.includes('_')) {
        // 이미 세션 ID가 있으면 그대로 사용
        console.log(`프론트엔드에서 세션 ID 전송됨: ${userEmail}`);
        processMessage(userEmail);
      } else {
        // 일반 이메일이면 기존 활성 세션 확인
        const checkActiveSessionQuery = `
          SELECT user FROM chat_messages 
          WHERE user LIKE ? AND type = 'user'
          ORDER BY timestamp DESC
          LIMIT 1
        `;
        
        const emailPattern = `${actualEmail}_%`;
        console.log(`활성 세션 확인: ${actualEmail}, 패턴: ${emailPattern}`);
        
        // db.get(checkActiveSessionQuery, [emailPattern], (err, row) => { // SQLite 제거
        //   if (err) {
        //     console.error('활성 세션 확인 오류:', err);
        //     // 오류 발생 시 새로운 세션 생성
        //     const newSessionId = `${actualEmail}_${Date.now()}`;
        //     console.log(`오류 발생, 새로운 세션 생성: ${newSessionId}`);
        //     socket.emit('new_session_created', { sessionId: newSessionId });
        //     processMessage(newSessionId);
        //     return;
        //   }
          
        //   if (row && row.user) {
        //     // 기존 활성 세션이 있으면 그 세션 사용
        //     console.log(`기존 활성 세션 발견: ${row.user}`);
        //     processMessage(row.user);
        //   } else {
        //     // 활성 세션이 없으면 새로운 세션 ID 생성
        //     const newSessionId = `${actualEmail}_${Date.now()}`;
        //     console.log(`활성 세션 없음, 새로운 세션 생성: ${newSessionId}`);
        //     // 새로운 세션 ID를 클라이언트에게 알림
        //     socket.emit('new_session_created', { sessionId: newSessionId });
        //     processMessage(newSessionId);
        //   }
        // });
      }
      
      function processMessage(sessionId) {
      const insertQuery = `
        INSERT INTO chat_messages (user, message, type, timestamp, file, file_name, file_type)
        VALUES (?, ?, ?, datetime('now', 'localtime'), ?, ?, ?)
      `;
      
      const paymentInfoJson = paymentInfo ? JSON.stringify(paymentInfo) : null;
      
      console.log('데이터베이스 저장 시도:', [
        sessionId, 
        message, 
        type,
        file || null,
        fileName || null,
        fileType || null
      ]);
      
      // db.run(insertQuery, [ // SQLite 제거
      //   sessionId, 
      //   message, 
      //   type,
      //   file || null,
      //   fileName || null,
      //   fileType || null
      // ], function(err) {
      //   if (err) {
      //     console.error('메시지 저장 오류:', err);
      //     socket.emit('message_error', { error: '메시지 저장에 실패했습니다.' });
      //     return;
      //   }

      //   // 한국 시간(KST)으로 현재 시간 생성
      //   const now = new Date();
      //   const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
      //   const timestamp = kstTime.toISOString().slice(0, 16).replace('T', ' ');
        
      //   const savedMessage = {
      //     id: this.lastID,
      //     user: sessionId,
      //     message,
      //     timestamp: timestamp,
      //     type,
      //     file: file || null,
      //     fileName: fileName || null,
      //     fileType: fileType || null
      //   };

      //   console.log('저장된 메시지:', savedMessage);

      //   // 모든 클라이언트에게 메시지 브로드캐스트
      //   io.emit('new_message', savedMessage);
        
      //   // 새로운 세션 ID가 생성된 경우, 해당 세션 ID로 메시지를 다시 전송
      //   if (sessionId !== userEmail) {
      //     console.log(`새로운 세션 ID로 메시지 재전송: ${sessionId}`);
      //     socket.emit('message_for_session', { 
      //       sessionId: sessionId, 
      //       message: savedMessage 
      //     });
      //   }
        
      //   console.log(`메시지 전송: ${userEmail} -> ${message}`);
      //   console.log(`연결된 클라이언트 수: ${Object.keys(io.sockets.sockets).length}`);
      // });
    }
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
app.get('/api/chat/messages', (req, res) => {
  const query = `
    SELECT * FROM chat_messages 
    ORDER BY timestamp ASC
  `;
  
  // db.all(query, [], (err, rows) => { // SQLite 제거
  //   if (err) {
  //     console.error('메시지 조회 오류:', err);
  //     return res.status(500).json({ error: '메시지 조회에 실패했습니다.' });
  //   }
    
  //   const messages = rows.map(row => ({
  //     id: row.id,
  //     user: row.user,
  //     message: row.message,
  //     timestamp: row.timestamp,
  //     type: row.type
  //   }));
    
  //   res.json(messages);
  // });
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

// 특정 유저의 채팅 메시지 삭제 API
app.delete('/api/chat/messages/user/:userEmail', (req, res) => {
  const { userEmail } = req.params;
  
  if (!userEmail) {
    return res.status(400).json({ error: '유저 이메일이 필요합니다.' });
  }
  
  const query = `DELETE FROM chat_messages WHERE user = ?`;
  
  // db.run(query, [ // SQLite 제거
  //   userEmail
  // ], function(err) {
  //   if (err) {
  //     console.error('유저 메시지 삭제 오류:', err);
  //     return res.status(500).json({ error: '유저 메시지 삭제에 실패했습니다.' });
  //   }
    
  //   console.log(`유저 ${userEmail}의 메시지 삭제 완료: ${this.changes}개 메시지 삭제됨`);
  //   res.json({ 
  //     message: `${userEmail}의 모든 채팅 메시지가 삭제되었습니다.`, 
  //     deletedCount: this.changes,
  //     userEmail: userEmail
  //   });
  // });
});

// 채팅 메시지를 파일로 저장하는 함수
const saveChatMessagesToFile = () => {
  const query = `
    SELECT * FROM chat_messages 
    ORDER BY timestamp ASC
  `;
  
  // db.all(query, [], (err, rows) => { // SQLite 제거
  //   if (err) {
  //     console.error('메시지 조회 오류:', err);
  //     return;
  //   }
    
  //   const messages = rows.map(row => ({
  //     id: row.id,
  //     user: row.user,
  //     message: row.message,
  //     timestamp: row.timestamp,
  //     type: row.type,
  //     status: row.status,
  //     file: row.file,
  //     fileName: row.file_name,
  //     fileType: row.file_type
  //   }));
    
  //   // 유저별로 메시지 그룹화
  //   const userMessages = {};
  //   messages.forEach(msg => {
  //     if (msg.user !== '관리자') {
  //       if (!userMessages[msg.user]) {
  //         userMessages[msg.user] = [];
  //       }
  //       userMessages[msg.user].push(msg);
  //     }
  //   });
    
  //   // 전체 메시지와 유저별 메시지를 각각 저장
  //   const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
  //   // 전체 메시지 TXT 저장
  //   const allMessagesTxtFile = path.join(__dirname, 'chat_exports', `all_messages_${timestamp}.txt`);
  //   fs.mkdirSync(path.dirname(allMessagesTxtFile), { recursive: true });
  //   let txtContent = '=== 전체 채팅 메시지 ===\n\n';
  //   messages.forEach(msg => {
  //     const date = new Date(msg.timestamp).toLocaleString('ko-KR');
  //     const type = msg.type === 'admin' ? '[관리자]' : '[사용자]';
  //     const fileInfo = msg.file ? ` (첨부파일: ${msg.fileName})` : '';
  //     txtContent += `[${date}] ${type} ${msg.user}: ${msg.message}${fileInfo}\n`;
  //   });
  //   fs.writeFileSync(allMessagesTxtFile, txtContent, 'utf8');
    
  //   // 유저별 메시지 저장 (TXT만)
  //   Object.keys(userMessages).forEach(userEmail => {
  //     // 유저별 TXT 파일 저장
  //     const userTxtFile = path.join(__dirname, 'chat_exports', `user_${userEmail.replace(/[@.]/g, '_')}_${timestamp}.txt`);
  //     let userTxtContent = `=== ${userEmail} 채팅 메시지 ===\n\n`;
  //     userMessages[userEmail].forEach(msg => {
  //       const date = new Date(msg.timestamp).toLocaleString('ko-KR');
  //       const type = msg.type === 'admin' ? '[관리자]' : '[사용자]';
  //       const fileInfo = msg.file ? ` (첨부파일: ${msg.fileName})` : '';
  //       userTxtContent += `[${date}] ${type} ${msg.user}: ${msg.message}${fileInfo}\n`;
  //     });
  //     fs.writeFileSync(userTxtFile, userTxtContent, 'utf8');
  //   });
    
  //   console.log(`채팅 메시지가 TXT 파일로 저장되었습니다. 전체: ${allMessagesTxtFile}`);
  // });
};

// 채팅 메시지를 파일로 저장하는 API
app.post('/api/chat/messages/export', (req, res) => {
  try {
    saveChatMessagesToFile();
    res.json({ 
      message: '채팅 메시지가 파일로 저장되었습니다.',
      location: path.join(__dirname, 'chat_exports')
    });
  } catch (error) {
    console.error('파일 저장 오류:', error);
    res.status(500).json({ error: '파일 저장에 실패했습니다.' });
  }
});

// 특정 유저의 채팅 메시지를 파일로 저장하는 API
app.post('/api/chat/messages/export/user/:userEmail', (req, res) => {
  const { userEmail } = req.params;
  
  if (!userEmail) {
    return res.status(400).json({ error: '유저 이메일이 필요합니다.' });
  }
  
  try {
    const query = `
      SELECT * FROM chat_messages 
      WHERE user = ?
      ORDER BY timestamp ASC
    `;
    
    // db.all(query, [ // SQLite 제거
    //   userEmail
    // ], (err, rows) => {
    //   if (err) {
    //     console.error('유저 메시지 조회 오류:', err);
    //     return res.status(500).json({ error: '유저 메시지 조회에 실패했습니다.' });
    //   }
      
    //   const messages = rows.map(row => ({
    //     id: row.id,
    //     user: row.user,
    //     message: row.message,
    //     timestamp: row.timestamp,
    //     type: row.type,
    //     status: row.status,
    //     file: row.file,
    //     fileName: row.file_name,
    //     fileType: row.file_type
    //   }));
      
    //   const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    //   const userTxtFile = path.join(__dirname, 'chat_exports', `user_${userEmail.replace(/[@.]/g, '_')}_${timestamp}.txt`);
      
    //   fs.mkdirSync(path.dirname(userTxtFile), { recursive: true });
      
    //   // TXT 파일 생성
    //   let txtContent = `=== ${userEmail} 채팅 메시지 ===\n\n`;
    //   messages.forEach(msg => {
    //     const date = new Date(msg.timestamp).toLocaleString('ko-KR');
    //     const type = msg.type === 'admin' ? '[관리자]' : '[사용자]';
    //     const fileInfo = msg.file ? ` (첨부파일: ${msg.fileName})` : '';
    //     txtContent += `[${date}] ${type} ${msg.user}: ${msg.message}${fileInfo}\n`;
    //   });
    //   fs.writeFileSync(userTxtFile, txtContent, 'utf8');
      
    //   console.log(`유저 ${userEmail}의 메시지가 TXT 파일로 저장되었습니다: ${userTxtFile}`);
    //   res.json({ 
    //     message: `${userEmail}의 채팅 메시지가 TXT 파일로 저장되었습니다.`,
    //     location: userTxtFile,
    //     messageCount: messages.length
    //   });
    // });
  } catch (error) {
    console.error('파일 저장 오류:', error);
    res.status(500).json({ error: '파일 저장에 실패했습니다.' });
  }
});

// 저장된 파일 목록 조회 API
app.get('/api/chat/messages/exports', (req, res) => {
  const exportsDir = path.join(__dirname, 'chat_exports');
  
  if (!fs.existsSync(exportsDir)) {
    return res.json({ files: [] });
  }
  
  try {
    const files = fs.readdirSync(exportsDir)
      .filter(file => file.endsWith('.txt'))
      .map(file => {
        const filePath = path.join(exportsDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          created: stats.birthtime,
          path: filePath,
          type: 'txt'
        };
      })
      .sort((a, b) => b.created - a.created);
    
    res.json({ files });
  } catch (error) {
    console.error('파일 목록 조회 오류:', error);
    res.status(500).json({ error: '파일 목록 조회에 실패했습니다.' });
  }
});

// 파일 다운로드 API
app.get('/api/chat/messages/download/:filename', (req, res) => {
  const { filename } = req.params;
  const exportsDir = path.join(__dirname, 'chat_exports');
  const filePath = path.join(exportsDir, filename);
  
  // 파일 존재 여부 확인
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
  }
  
  // 파일 다운로드
  res.download(filePath, filename, (err) => {
    if (err) {
      console.error('파일 다운로드 오류:', err);
      res.status(500).json({ error: '파일 다운로드에 실패했습니다.' });
    }
  });
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