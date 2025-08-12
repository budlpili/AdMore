#!/bin/bash

# ADMORE 분리 배포 상태 확인 스크립트
echo "🔍 ADMORE 분리 배포 상태 확인 중..."

# 환경변수 확인
BACKEND_URL=${BACKEND_URL:-"https://admore-backend.cloudtype.app"}
FRONTEND_URL=${FRONTEND_URL:-"https://admore-frontend.cloudtype.app"}

echo "📍 백엔드 URL: $BACKEND_URL"
echo "📍 프론트엔드 URL: $FRONTEND_URL"
echo ""

# 1. 백엔드 상태 확인
echo "🌐 백엔드 상태 확인 중..."
if curl -s "$BACKEND_URL/api/health" > /dev/null; then
    echo "✅ 백엔드 API: 정상 동작"
else
    echo "❌ 백엔드 API: 연결 실패"
fi

# 2. 프론트엔드 상태 확인
echo "🌐 프론트엔드 상태 확인 중..."
if curl -s "$FRONTEND_URL" > /dev/null; then
    echo "✅ 프론트엔드: 정상 접속"
else
    echo "❌ 프론트엔드: 연결 실패"
fi

# 3. WebSocket 연결 확인
echo "🔌 WebSocket 연결 확인 중..."
if curl -s "$BACKEND_URL/socket.io/" > /dev/null; then
    echo "✅ WebSocket: 정상 동작"
else
    echo "❌ WebSocket: 연결 실패"
fi

# 4. MongoDB 연결 확인
echo "🗄️  MongoDB 연결 확인 중..."
if curl -s "$BACKEND_URL/api/health" | grep -q "MongoDB"; then
    echo "✅ MongoDB: 정상 연결"
else
    echo "⚠️  MongoDB: 연결 상태 불명"
fi

# 5. CORS 설정 확인
echo "🔒 CORS 설정 확인 중..."
CORS_HEADERS=$(curl -s -I -H "Origin: $FRONTEND_URL" "$BACKEND_URL/api/health" 2>/dev/null)
if echo "$CORS_HEADERS" | grep -q "Access-Control-Allow-Origin"; then
    echo "✅ CORS: 정상 설정"
else
    echo "❌ CORS: 설정 문제"
fi

echo ""
echo "📊 배포 상태 요약:"
echo "백엔드: $BACKEND_URL"
echo "프론트엔드: $FRONTEND_URL"
echo ""
echo "🔧 문제 해결 방법:"
echo "1. 백엔드 연결 실패: CloudType 백엔드 프로젝트 상태 확인"
echo "2. 프론트엔드 연결 실패: CloudType 프론트엔드 프로젝트 상태 확인"
echo "3. CORS 문제: 백엔드 환경변수 FRONTEND_URL 설정 확인"
echo "4. MongoDB 연결 실패: MONGODB_URI 환경변수 확인"
