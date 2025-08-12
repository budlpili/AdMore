#!/bin/bash

# ADMORE 백엔드 전용 배포 스크립트 (CloudType용)
echo "🚀 ADMORE 백엔드 배포 시작..."

# 1. 백엔드 디렉토리로 이동
cd backend

# 2. 의존성 설치
echo "📦 의존성 설치 중..."
npm install

# 3. 환경변수 확인
echo "🔧 환경변수 확인 중..."
if [ ! -f .env ]; then
    echo "⚠️  .env 파일이 없습니다. CloudType에서 환경변수를 설정해주세요."
    echo "필요한 환경변수:"
    echo "  - NODE_ENV=production"
    echo "  - PORT=5001"
    echo "  - JWT_SECRET=your_jwt_secret"
    echo "  - MONGODB_URI=mongodb+srv://..."
    echo "  - FRONTEND_URL=https://your-frontend-domain.com"
    echo "  - SMTP_HOST=smtp.gmail.com"
    echo "  - SMTP_USER=your_email@gmail.com"
    echo "  - SMTP_PASS=your_app_password"
    echo "  - MAIL_FROM=ADMore <your_email@gmail.com>"
fi

# 4. MongoDB 연결 테스트 (환경변수가 설정된 경우)
if [ ! -z "$MONGODB_URI" ]; then
    echo "🗄️  MongoDB 연결 테스트 중..."
    node -e "
    const mongoose = require('mongoose');
    mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(() => {
        console.log('✅ MongoDB 연결 성공');
        process.exit(0);
    }).catch(err => {
        console.error('❌ MongoDB 연결 실패:', err.message);
        process.exit(1);
    });
    "
else
    echo "⚠️  MONGODB_URI 환경변수가 설정되지 않았습니다."
fi

# 5. 서버 시작
echo "🌐 백엔드 서버 시작 중..."
echo "📍 서버가 포트 5001에서 실행됩니다."
echo "📍 MongoDB Atlas 연결 대기 중..."

npm start
