#!/bin/bash

echo "🚀 CloudType 수동 배포 가이드"
echo "================================"
echo ""

# CloudType CLI 설치 확인
if ! command -v ctype &> /dev/null; then
    echo "❌ CloudType CLI가 설치되지 않았습니다."
    echo "설치 방법: npm install -g @cloudtype/cli"
    echo ""
    echo "또는 GitHub Actions를 통해 자동 배포를 사용하세요:"
    echo "1. GitHub 저장소의 Settings > Secrets and variables > Actions"
    echo "2. CLOUDTYPE_TOKEN 시크릿 추가"
    echo "3. main 브랜치에 푸시하면 자동 배포됨"
    exit 1
fi

echo "✅ CloudType CLI 설치됨: $(ctype --version)"
echo ""

# 로그인 상태 확인
echo "🔐 CloudType 로그인 상태 확인 중..."
if ! ctype whoami &> /dev/null; then
    echo "❌ 로그인이 필요합니다."
    echo "로그인 방법: ctype login"
    echo ""
    echo "또는 토큰으로 로그인: ctype login -t YOUR_TOKEN"
    exit 1
fi

echo "✅ CloudType에 로그인됨: $(ctype whoami)"
echo ""

# 배포 옵션 선택
echo "📋 배포할 서비스를 선택하세요:"
echo "1) 전체 배포 (프론트엔드 + 백엔드 + MongoDB)"
echo "2) 프론트엔드만 배포"
echo "3) 백엔드만 배포"
echo "4) MongoDB만 배포"
echo "5) 현재 상태 확인"
echo ""

read -p "선택 (1-5): " choice

case $choice in
    1)
        echo "🔄 전체 배포 시작..."
        echo "📱 프론트엔드 배포 중..."
        ctype apply -f admore-react-final.yaml
        echo "🔧 백엔드 배포 중..."
        ctype apply -f admore-backend-mongodb.yaml
        echo "🗄️ MongoDB 배포 중..."
        ctype apply -f admore-mongodb.yaml
        echo "✅ 전체 배포 완료!"
        ;;
    2)
        echo "📱 프론트엔드 배포 시작..."
        ctype apply -f admore-react-final.yaml
        echo "✅ 프론트엔드 배포 완료!"
        ;;
    3)
        echo "🔧 백엔드 배포 시작..."
        ctype apply -f admore-backend-mongodb.yaml
        echo "✅ 백엔드 배포 완료!"
        ;;
    4)
        echo "🗄️ MongoDB 배포 시작..."
        ctype apply -f admore-mongodb.yaml
        echo "✅ MongoDB 배포 완료!"
        ;;
    5)
        echo "📊 현재 상태 확인 중..."
        ctype list
        ;;
    *)
        echo "❌ 잘못된 선택입니다."
        exit 1
        ;;
esac

echo ""
echo "🎉 배포가 완료되었습니다!"
echo "CloudType 대시보드에서 배포 상태를 확인하세요: https://app.cloudtype.io"
