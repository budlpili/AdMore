#!/bin/bash

# ADMORE 프론트엔드 배포 스크립트
echo "🚀 ADMORE 프론트엔드 배포 시작..."

# 1. 의존성 설치
echo "📦 의존성 설치 중..."
npm install

# 2. 환경변수 확인
echo "🔧 환경변수 확인 중..."
if [ -z "$REACT_APP_API_URL" ]; then
    echo "⚠️  REACT_APP_API_URL 환경변수가 설정되지 않았습니다."
    echo "기본값 (http://localhost:5001)을 사용합니다."
    export REACT_APP_API_URL="http://localhost:5001"
fi

if [ -z "$REACT_APP_WS_URL" ]; then
    echo "⚠️  REACT_APP_WS_URL 환경변수가 설정되지 않았습니다."
    echo "기본값 (http://localhost:5001)을 사용합니다."
    export REACT_APP_WS_URL="http://localhost:5001"
fi

echo "📍 API URL: $REACT_APP_API_URL"
echo "📍 WebSocket URL: $REACT_APP_WS_URL"

# 3. 빌드
echo "🔨 프로덕션 빌드 중..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ 빌드 성공!"
    echo "📍 빌드 결과: build/ 디렉토리"
    echo "📍 파일 크기:"
    du -sh build/*
else
    echo "❌ 빌드 실패!"
    exit 1
fi

# 4. 개발 서버 시작 (선택사항)
read -p "개발 서버를 시작하시겠습니까? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌐 개발 서버 시작 중..."
    echo "📍 서버가 http://localhost:3000 에서 실행됩니다."
    npm start
fi
