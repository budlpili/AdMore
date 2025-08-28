#!/bin/bash

echo "🚀 CloudType 배포 시작..."

# 1. MongoDB 서버 배포
echo "📊 1단계: MongoDB 서버 배포"
echo "CloudType 웹 대시보드에서 다음 설정으로 배포하세요:"
echo "  - App Name: admore-mongodb"
echo "  - App Type: mongo@4.0"
echo "  - Port: 27017"
echo "  - Memory: 0.25GB"
echo "  - CPU: 0.25"
echo ""

# 2. 백엔드 서버 배포
echo "🔧 2단계: 백엔드 서버 배포"
echo "CloudType 웹 대시보드에서 다음 설정으로 배포하세요:"
echo "  - App Name: admore-backend-mongodb"
echo "  - App Type: dockerfile"
echo "  - Dockerfile: Dockerfile.backend"
echo "  - Port: 5001"
echo "  - Memory: 0.5GB"
echo "  - CPU: 0.25"
echo ""

# 3. 프론트엔드 배포
echo "🌐 3단계: 프론트엔드 배포"
echo "CloudType 웹 대시보드에서 다음 설정으로 배포하세요:"
echo "  - App Name: admore-react-final"
echo "  - App Type: dockerfile"
echo "  - Dockerfile: Dockerfile.frontend"
echo "  - Port: 80"
echo "  - Memory: 0.05GB"
echo "  - CPU: 0.05"
echo ""

echo "✅ 배포 완료 후 다음 URL들을 확인하세요:"
echo "  - MongoDB: admore-mongodb.budlpili.cloudtype.app:27017"
echo "  - Backend: https://admore-backend-mongodb.budlpili.cloudtype.app"
echo "  - Frontend: https://admore-react-final.budlpili.cloudtype.app"
echo ""
echo "🔗 CloudType 대시보드: https://cloudtype.app"
