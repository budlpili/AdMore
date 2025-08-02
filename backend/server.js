console.log('=== [실행 중인 server.js] ===');
console.log(__filename);
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
require('dotenv').config();

// 데이터베이스 연결
const db = require('./config/database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
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
    methods: ["GET", "POST"],
    credentials: true
  }
});

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

// WebSocket 연결 관리
const connectedUsers = new Map(); // socketId -> userEmail
const userSockets = new Map(); // userEmail -> socketId

// WebSocket 이벤트 핸들러
io.on('connection', (socket) => {
  console.log('새로운 클라이언트 연결:', socket.id);

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
      
      // 데이터베이스에 메시지 저장
      const insertQuery = `
        INSERT INTO chat_messages (user, message, type, timestamp, file, file_name, file_type)
        VALUES (?, ?, ?, datetime('now', 'localtime'), ?, ?, ?)
      `;
      
      const paymentInfoJson = paymentInfo ? JSON.stringify(paymentInfo) : null;
      
      console.log('데이터베이스 저장 시도:', [
        userEmail, 
        message, 
        type,
        file || null,
        fileName || null,
        fileType || null
      ]);
      
      db.run(insertQuery, [
        userEmail, 
        message, 
        type,
        file || null,
        fileName || null,
        fileType || null
      ], function(err) {
        if (err) {
          console.error('메시지 저장 오류:', err);
          socket.emit('message_error', { error: '메시지 저장에 실패했습니다.' });
          return;
        }

        // 한국 시간(KST)으로 현재 시간 생성
        const now = new Date();
        const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
        const timestamp = kstTime.toISOString().slice(0, 16).replace('T', ' ');
        
        const savedMessage = {
          id: this.lastID,
          user: userEmail,
          message,
          timestamp: timestamp,
          type,
          file: file || null,
          fileName: fileName || null,
          fileType: fileType || null
        };

        console.log('저장된 메시지:', savedMessage);

        // 모든 클라이언트에게 메시지 브로드캐스트
        io.emit('new_message', savedMessage);
        
        console.log(`메시지 전송: ${userEmail} -> ${message}`);
        console.log(`연결된 클라이언트 수: ${Object.keys(io.sockets.sockets).length}`);
      });
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
      
      db.run(updateQuery, [status, userEmail], function(err) {
        if (err) {
          console.error('상태 업데이트 오류:', err);
          return;
        }
        
        // 모든 클라이언트에게 상태 업데이트 알림
        io.emit('message_status_updated', { userEmail, status });
        console.log(`메시지 상태 업데이트: ${userEmail} -> ${status}`);
      });
    } catch (error) {
      console.error('상태 업데이트 처리 오류:', error);
    }
  });

  // 연결 해제
  socket.on('disconnect', () => {
    const userEmail = connectedUsers.get(socket.id);
    if (userEmail) {
      connectedUsers.delete(socket.id);
      userSockets.delete(userEmail);
      console.log(`사용자 연결 해제: ${userEmail}`);
      
      // 관리자에게 사용자 연결 해제 알림
      socket.broadcast.emit('user_disconnected', userEmail);
    }
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

// 채팅 관련 API
app.get('/api/chat/messages', (req, res) => {
  const query = `
    SELECT * FROM chat_messages 
    ORDER BY timestamp ASC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('메시지 조회 오류:', err);
      return res.status(500).json({ error: '메시지 조회에 실패했습니다.' });
    }
    
    const messages = rows.map(row => ({
      id: row.id,
      user: row.user,
      message: row.message,
      timestamp: row.timestamp,
      type: row.type
    }));
    
    res.json(messages);
  });
});

// 모든 메시지 삭제 API
app.delete('/api/chat/messages/clear', (req, res) => {
  const query = `DELETE FROM chat_messages`;
  
  db.run(query, [], function(err) {
    if (err) {
      console.error('메시지 삭제 오류:', err);
      return res.status(500).json({ error: '메시지 삭제에 실패했습니다.' });
    }
    
    console.log(`모든 메시지 삭제 완료: ${this.changes}개 메시지 삭제됨`);
    res.json({ message: '모든 메시지가 삭제되었습니다.', deletedCount: this.changes });
  });
});

// 특정 유저의 채팅 메시지 삭제 API
app.delete('/api/chat/messages/user/:userEmail', (req, res) => {
  const { userEmail } = req.params;
  
  if (!userEmail) {
    return res.status(400).json({ error: '유저 이메일이 필요합니다.' });
  }
  
  const query = `DELETE FROM chat_messages WHERE user = ?`;
  
  db.run(query, [userEmail], function(err) {
    if (err) {
      console.error('유저 메시지 삭제 오류:', err);
      return res.status(500).json({ error: '유저 메시지 삭제에 실패했습니다.' });
    }
    
    console.log(`유저 ${userEmail}의 메시지 삭제 완료: ${this.changes}개 메시지 삭제됨`);
    res.json({ 
      message: `${userEmail}의 모든 채팅 메시지가 삭제되었습니다.`, 
      deletedCount: this.changes,
      userEmail: userEmail
    });
  });
});

// 채팅 메시지를 파일로 저장하는 함수
const saveChatMessagesToFile = () => {
  const query = `
    SELECT * FROM chat_messages 
    ORDER BY timestamp ASC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('메시지 조회 오류:', err);
      return;
    }
    
    const messages = rows.map(row => ({
      id: row.id,
      user: row.user,
      message: row.message,
      timestamp: row.timestamp,
      type: row.type,
      status: row.status,
      file: row.file,
      fileName: row.file_name,
      fileType: row.file_type
    }));
    
    // 유저별로 메시지 그룹화
    const userMessages = {};
    messages.forEach(msg => {
      if (msg.user !== '관리자') {
        if (!userMessages[msg.user]) {
          userMessages[msg.user] = [];
        }
        userMessages[msg.user].push(msg);
      }
    });
    
    // 전체 메시지와 유저별 메시지를 각각 저장
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // 전체 메시지 JSON 저장
    const allMessagesFile = path.join(__dirname, 'chat_exports', `all_messages_${timestamp}.json`);
    fs.mkdirSync(path.dirname(allMessagesFile), { recursive: true });
    fs.writeFileSync(allMessagesFile, JSON.stringify(messages, null, 2), 'utf8');
    
    // 전체 메시지 TXT 저장
    const allMessagesTxtFile = path.join(__dirname, 'chat_exports', `all_messages_${timestamp}.txt`);
    let txtContent = '=== 전체 채팅 메시지 ===\n\n';
    messages.forEach(msg => {
      const date = new Date(msg.timestamp).toLocaleString('ko-KR');
      const type = msg.type === 'admin' ? '[관리자]' : '[사용자]';
      const fileInfo = msg.file ? ` (첨부파일: ${msg.fileName})` : '';
      txtContent += `[${date}] ${type} ${msg.user}: ${msg.message}${fileInfo}\n`;
    });
    fs.writeFileSync(allMessagesTxtFile, txtContent, 'utf8');
    
    // 유저별 메시지 저장
    Object.keys(userMessages).forEach(userEmail => {
      const userJsonFile = path.join(__dirname, 'chat_exports', `user_${userEmail.replace(/[@.]/g, '_')}_${timestamp}.json`);
      fs.writeFileSync(userJsonFile, JSON.stringify(userMessages[userEmail], null, 2), 'utf8');
      
      // 유저별 TXT 파일 저장
      const userTxtFile = path.join(__dirname, 'chat_exports', `user_${userEmail.replace(/[@.]/g, '_')}_${timestamp}.txt`);
      let userTxtContent = `=== ${userEmail} 채팅 메시지 ===\n\n`;
      userMessages[userEmail].forEach(msg => {
        const date = new Date(msg.timestamp).toLocaleString('ko-KR');
        const type = msg.type === 'admin' ? '[관리자]' : '[사용자]';
        const fileInfo = msg.file ? ` (첨부파일: ${msg.fileName})` : '';
        userTxtContent += `[${date}] ${type} ${msg.user}: ${msg.message}${fileInfo}\n`;
      });
      fs.writeFileSync(userTxtFile, userTxtContent, 'utf8');
    });
    
    console.log(`채팅 메시지가 JSON과 TXT 파일로 저장되었습니다. 전체: ${allMessagesFile}`);
  });
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
    
    db.all(query, [userEmail], (err, rows) => {
      if (err) {
        console.error('유저 메시지 조회 오류:', err);
        return res.status(500).json({ error: '유저 메시지 조회에 실패했습니다.' });
      }
      
      const messages = rows.map(row => ({
        id: row.id,
        user: row.user,
        message: row.message,
        timestamp: row.timestamp,
        type: row.type,
        status: row.status,
        file: row.file,
        fileName: row.file_name,
        fileType: row.file_type
      }));
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const userJsonFile = path.join(__dirname, 'chat_exports', `user_${userEmail.replace(/[@.]/g, '_')}_${timestamp}.json`);
      const userTxtFile = path.join(__dirname, 'chat_exports', `user_${userEmail.replace(/[@.]/g, '_')}_${timestamp}.txt`);
      
      fs.mkdirSync(path.dirname(userJsonFile), { recursive: true });
      fs.writeFileSync(userJsonFile, JSON.stringify(messages, null, 2), 'utf8');
      
      // TXT 파일 생성
      let txtContent = `=== ${userEmail} 채팅 메시지 ===\n\n`;
      messages.forEach(msg => {
        const date = new Date(msg.timestamp).toLocaleString('ko-KR');
        const type = msg.type === 'admin' ? '[관리자]' : '[사용자]';
        const fileInfo = msg.file ? ` (첨부파일: ${msg.fileName})` : '';
        txtContent += `[${date}] ${type} ${msg.user}: ${msg.message}${fileInfo}\n`;
      });
      fs.writeFileSync(userTxtFile, txtContent, 'utf8');
      
      console.log(`유저 ${userEmail}의 메시지가 JSON과 TXT 파일로 저장되었습니다: ${userJsonFile}`);
      res.json({ 
        message: `${userEmail}의 채팅 메시지가 JSON과 TXT 파일로 저장되었습니다.`,
        location: userJsonFile,
        txtLocation: userTxtFile,
        messageCount: messages.length
      });
    });
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
      .filter(file => file.endsWith('.json') || file.endsWith('.txt'))
      .map(file => {
        const filePath = path.join(exportsDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          created: stats.birthtime,
          path: filePath,
          type: file.endsWith('.json') ? 'json' : 'txt'
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