#!/bin/bash

# ADMORE 백엔드 배포 스크립트
echo "🚀 ADMORE 백엔드 배포 시작..."

# 1. 백엔드 디렉토리로 이동
cd backend

# 2. 의존성 설치
echo "📦 의존성 설치 중..."
npm install

# 3. 환경변수 확인
echo "🔧 환경변수 확인 중..."
if [ ! -f .env ]; then
    echo "⚠️  .env 파일이 없습니다. 환경변수를 설정해주세요."
    echo "필요한 환경변수:"
    echo "  - NODE_ENV"
    echo "  - PORT"
    echo "  - JWT_SECRET"
    echo "  - DATABASE_URL"
    echo "  - SMTP_HOST"
    echo "  - SMTP_USER"
    echo "  - SMTP_PASS"
    exit 1
fi

# 4. 데이터베이스 연결 테스트
echo "🗄️  데이터베이스 연결 테스트 중..."
node -e "
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('admore.db');
db.get('SELECT 1', (err, row) => {
    if (err) {
        console.error('❌ 데이터베이스 연결 실패:', err.message);
        process.exit(1);
    } else {
        console.log('✅ 데이터베이스 연결 성공');
        db.close();
    }
});
"

# 5. 서버 시작
echo "🌐 서버 시작 중..."
echo "📍 서버가 http://localhost:5001 에서 실행됩니다."
echo "📍 API 문서: http://localhost:5001/api"
echo "📍 WebSocket: ws://localhost:5001"

npm start
