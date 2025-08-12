# 🚀 ADMORE - 소셜미디어 마케팅 서비스 플랫폼

## 📖 프로젝트 개요

ADMORE는 소셜미디어 마케팅 서비스를 제공하는 풀스택 웹 애플리케이션입니다. 페이스북, 인스타그램, 유튜브 등 다양한 소셜미디어 플랫폼의 팔로워 증가, 좋아요 증가 등의 서비스를 제공하며, 실시간 채팅을 통한 고객 상담을 지원합니다.

## ✨ 주요 기능

### 🔐 사용자 관리

- **회원가입/로그인**: 이메일 인증 기반 회원가입
- **사용자 프로필**: 개인정보 관리 및 설정
- **권한 관리**: 일반 사용자, 관리자 역할 구분

### 🛍️ 상품 관리

- **상품 카탈로그**: 카테고리별 상품 분류
- **상품 상세**: 가격, 할인율, 설명, 리뷰
- **즐겨찾기**: 사용자별 관심 상품 관리

### 📊 주문 및 결제

- **주문 시스템**: 상품 선택 및 수량 설정
- **결제 방법**: 신용카드, 가상계좌
- **주문 상태**: 실시간 주문 진행 상황 추적

### 💬 고객 상담

- **실시간 채팅**: WebSocket 기반 1:1 상담
- **상담 기록**: 채팅 내역 저장 및 관리
- **자동 응답**: 기본 안내 메시지 제공

### 📝 리뷰 시스템

- **리뷰 작성**: 구매 완료 후 리뷰 작성
- **별점 평가**: 5점 만점 평점 시스템
- **리뷰 관리**: 관리자 리뷰 응답 및 관리

### 🎯 관리자 기능

- **대시보드**: 주문 통계, 사용자 현황
- **사용자 관리**: 회원 정보, 상태 관리
- **상품 관리**: 상품 CRUD, 카테고리 관리
- **주문 관리**: 주문 상태 변경, 처리 현황

## 🏗️ 기술 스택

### Frontend

- **React 18** + **TypeScript**
- **Tailwind CSS** - 스타일링
- **Chart.js** - 데이터 시각화
- **FontAwesome** - 아이콘
- **React Router** - 라우팅
- **Socket.IO Client** - 실시간 통신

### Backend

- **Node.js** + **Express.js**
- **MongoDB Atlas** - 클라우드 데이터베이스
- **Socket.IO** - WebSocket 서버
- **Nodemailer** - 이메일 발송
- **JWT** - 인증 토큰
- **bcryptjs** - 비밀번호 암호화

### Development Tools

- **ESLint** - 코드 품질
- **Prettier** - 코드 포맷팅
- **Git** - 버전 관리
- **Docker** - 컨테이너화

## 🚀 설치 및 실행

### Prerequisites

- Node.js 18+
- npm 또는 yarn
- MongoDB Atlas 계정 (프로덕션용)

### 1. 저장소 클론

```bash
git clone https://github.com/budlpili/AdMore.git
cd ADMore
```

### 2. 프론트엔드 의존성 설치

```bash
npm install
```

### 3. 백엔드 의존성 설치

```bash
cd backend
npm install
cd ..
```

### 4. 환경변수 설정

#### Frontend (.env)

```bash
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_WS_URL=http://localhost:5001
```

#### Backend (.env)

```bash
PORT=5001
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key
MONGODB_URI=mongodb://localhost:27017/admore

# SMTP 설정 (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
MAIL_FROM=ADMore <your_email@gmail.com>
```

### 5. 애플리케이션 실행

#### 백엔드 서버 시작

```bash
cd backend
npm start
```

#### 프론트엔드 개발 서버 시작 (새 터미널)

```bash
npm start
```

### 6. 브라우저에서 확인

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:5001

## 📱 주요 페이지

### 사용자 페이지

- **홈**: 메인 페이지, 인기 상품, 카테고리
- **상품 목록**: 카테고리별 상품 검색 및 필터링
- **상품 상세**: 상품 정보, 가격, 주문, 리뷰
- **마이페이지**: 주문 내역, 즐겨찾기, 쿠폰, 설정
- **회원가입/로그인**: 사용자 인증

### 관리자 페이지

- **대시보드**: 통계, 차트, 현황 요약
- **사용자 관리**: 회원 정보, 상태 관리
- **상품 관리**: 상품 CRUD, 카테고리 관리
- **주문 관리**: 주문 상태, 처리 현황
- **리뷰 관리**: 리뷰 응답, 관리
- **상담 관리**: 채팅 내역, 사용자 상담

## 🔧 개발 가이드

### 코드 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
├── pages/              # 페이지 컴포넌트
├── services/           # API 서비스
├── hooks/              # 커스텀 훅
├── types/              # TypeScript 타입 정의
├── utils/              # 유틸리티 함수
└── css/                # 스타일 파일

backend/
├── controllers/        # 비즈니스 로직
├── routes/             # API 라우트
├── models/             # 데이터 모델
├── middleware/         # 미들웨어
└── config/             # 설정 파일
```

### API 엔드포인트

- **인증**: `/api/auth/*`
- **사용자**: `/api/users/*`
- **상품**: `/api/products/*`
- **주문**: `/api/orders/*`
- **리뷰**: `/api/reviews/*`
- **상담**: `/api/customer-service/*`

### 데이터베이스 스키마

- **users**: 사용자 정보
- **products**: 상품 정보
- **orders**: 주문 정보
- **reviews**: 리뷰 정보
- **chat_messages**: 채팅 메시지

## 🚀 배포

### 🏗️ CloudType 분리 배포 (권장)

CloudType에서 프론트엔드와 백엔드를 별도의 프로젝트로 분리하여 배포하는 방법입니다. 이 방식은 각 서비스의 독립성을 보장하고 확장성을 높일 수 있습니다.

#### **1단계: 백엔드 프로젝트 생성**

##### **프로젝트 설정**

1. **프로젝트명**: `admore-backend`
2. **Git URL**: `https://github.com/budlpili/AdMore.git`
3. **브랜치**: `main`
4. **빌드 타입**: `Dockerfile`

##### **백엔드 전용 Dockerfile 사용**

```dockerfile
# Dockerfile.backend 사용
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./
RUN mkdir -p uploads chat_exports
ENV NODE_ENV=production
ENV PORT=5001
EXPOSE 5001
CMD ["npm", "start"]
```

##### **빌드 설정**

```bash
# Install Command
npm ci

# Build Command
# Dockerfile.backend를 사용하므로 별도 빌드 불필요

# Start Command
npm start

# Port
5001
```

##### **환경변수 설정**

```bash
# MongoDB Atlas 연결
MONGODB_URI=mongodb+srv://admore_user:your_password@cluster.mongodb.net/admore

# 기본 설정
NODE_ENV=production
PORT=5001
JWT_SECRET=admore_jwt_secret_key_2024_secure_version

# 프론트엔드 도메인 허용
FRONTEND_URL=https://admore-frontend.cloudtype.app
ALLOWED_ORIGINS=https://admore-frontend.cloudtype.app,https://your-domain.com

# 이메일 설정 (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_USER=budlpili@gmail.com
SMTP_PASS=
MAIL_FROM=ADMore <budlpili@gmail.com>
```

#### **2단계: 프론트엔드 프로젝트 생성**

##### **프로젝트 설정**

1. **프로젝트명**: `admore-frontend`
2. **Git URL**: `https://github.com/budlpili/AdMore.git`
3. **브랜치**: `main`
4. **빌드 타입**: `Dockerfile`

##### **프론트엔드 전용 Dockerfile 사용**

```dockerfile
# Dockerfile.frontend 사용
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

##### **빌드 설정**

```bash
# Install Command
npm ci

# Build Command
npm run build

# Start Command
# Nginx가 자동으로 시작됨

# Port
80
```

##### **환경변수 설정**

```bash
# 백엔드 API 연결
REACT_APP_API_URL=https://admore-backend.cloudtype.app/api
REACT_APP_WS_URL=https://admore-backend.cloudtype.app

# Nginx 프록시 설정
BACKEND_URL=https://admore-backend.cloudtype.app

# 기타 설정
NODE_ENV=production
PORT=80
```

#### **3단계: 배포 순서 및 확인**

##### **배포 순서**

1. **백엔드 먼저 배포**: MongoDB Atlas 연결 및 API 서버 실행
2. **프론트엔드 배포**: 백엔드 API 주소로 연결 설정
3. **연결 테스트**: API 호출 및 WebSocket 연결 확인

##### **연결 테스트**

```bash
# 백엔드 API 테스트
curl https://admore-backend.cloudtype.app/api/health

# 프론트엔드 접속 테스트
curl https://admore-frontend.cloudtype.app

# WebSocket 연결 테스트
wscat -c wss://admore-backend.cloudtype.app
```

#### **4단계: 도메인 및 환경변수 관리**

##### **백엔드 도메인**

- **CloudType 제공**: `https://admore-backend.cloudtype.app`
- **커스텀 도메인**: `https://api.yourdomain.com` (선택사항)

##### **프론트엔드 도메인**

- **CloudType 제공**: `https://admore-frontend.cloudtype.app`
- **커스텀 도메인**: `https://yourdomain.com` (선택사항)

##### **환경변수 동기화**

- **백엔드**: `FRONTEND_URL` 설정으로 CORS 허용
- **프론트엔드**: `REACT_APP_API_URL` 설정으로 API 연결

#### **장점**

- **독립성**: 각 서비스별 독립적 배포 및 관리
- **확장성**: 백엔드와 프론트엔드별로 리소스 조정 가능
- **유지보수성**: 각 서비스별로 다른 업데이트 주기 적용
- **장애 격리**: 한 서비스의 문제가 다른 서비스에 영향 주지 않음

#### **주의사항**

- **CORS 설정**: 백엔드에서 프론트엔드 도메인 허용 필요
- **환경변수 관리**: 두 프로젝트의 환경변수 동기화 필요
- **네트워크 지연**: 서비스 간 통신으로 인한 약간의 지연 가능성

#### **모니터링**

- **백엔드**: API 응답 시간, MongoDB 연결 상태, 에러 로그
- **프론트엔드**: 페이지 로딩 시간, API 호출 성공률, 사용자 경험
- **통합**: 두 서비스 간의 연결 상태 및 성능 지표

### 🔧 분리 배포의 장점

#### **확장성**

- **백엔드**: 필요에 따라 CPU/메모리 확장
- **프론트엔드**: CDN을 통한 글로벌 배포
- **데이터베이스**: 독립적인 스케일링

#### **유지보수성**

- **백엔드**: API 버전 관리, 데이터베이스 마이그레이션
- **프론트엔드**: UI/UX 개선, 성능 최적화
- **독립적 배포**: 각각의 서비스별로 배포 일정 관리

#### **비용 효율성**

- **백엔드**: 사용량 기반 과금
- **프론트엔드**: 정적 호스팅으로 저비용
- **리소스 최적화**: 각 서비스에 필요한 만큼만 할당

### 🚨 주의사항

#### **CORS 설정**

- 백엔드에서 프론트엔드 도메인을 허용하도록 설정
- `FRONTEND_URL` 환경변수로 동적 설정

#### **환경변수 관리**

- 프로덕션 환경변수는 절대 GitHub에 커밋하지 않음
- 각 배포 플랫폼의 환경변수 설정 기능 사용

#### **데이터베이스 백업**

- 정기적인 데이터베이스 백업 설정
- 마이그레이션 스크립트 준비

### 📱 모니터링 및 로그

#### **백엔드 모니터링**

- CloudType 대시보드에서 로그 확인
- 에러 알림 설정
- 성능 메트릭 모니터링

#### **프론트엔드 모니터링**

- CloudType 대시보드에서 빌드 상태 확인
- 사용자 접속 통계
- 에러 로그 분석

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 문의

- **프로젝트 링크**: [https://github.com/budlpili/AdMore](https://github.com/budlpili/AdMore)
- **이메일**: budlpili@gmail.com

## 🙏 감사의 말

이 프로젝트를 개발하는 데 도움을 주신 모든 분들께 감사드립니다.

---

**ADMORE** - 소셜미디어 마케팅의 새로운 기준을 제시합니다! 🚀✨
