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
- **SQLite** - 데이터베이스
- **Socket.IO** - WebSocket 서버
- **Nodemailer** - 이메일 발송
- **JWT** - 인증 토큰
- **bcryptjs** - 비밀번호 암호화

### Development Tools

- **ESLint** - 코드 품질
- **Prettier** - 코드 포맷팅
- **Git** - 버전 관리

## 🚀 설치 및 실행

### Prerequisites

- Node.js 18+
- npm 또는 yarn

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
REACT_APP_API_URL=http://localhost:5001
REACT_APP_WS_URL=http://localhost:5001
```

#### Backend (.env)

```bash
PORT=5001
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key
APP_BASE_URL=http://localhost:3000

# SMTP 설정 (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
MAIL_FROM=ADMore <your_email@gmail.com>
```

### 5. 데이터베이스 초기화

```bash
cd backend
node -e "
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('admore.db');
db.serialize(() => {
  // 데이터베이스 스키마 생성
  db.run(\`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    joinDate TEXT DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active',
    role TEXT DEFAULT 'user',
    emailVerified INTEGER DEFAULT 0
  )\`);

  db.run(\`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price TEXT NOT NULL,
    category TEXT NOT NULL,
    image TEXT,
    background TEXT,
    rating REAL DEFAULT 0,
    reviewCount INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active'
  )\`);

  db.run(\`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    productId INTEGER,
    quantity INTEGER DEFAULT 1,
    totalPrice TEXT,
    paymentMethod TEXT,
    status TEXT DEFAULT 'pending',
    orderDate TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users (id),
    FOREIGN KEY (productId) REFERENCES products (id)
  )\`);

  console.log('데이터베이스 초기화 완료');
});
db.close();
"
```

### 6. 애플리케이션 실행

#### 백엔드 서버 시작

```bash
cd backend
npm start
# 또는
node server.js
```

#### 프론트엔드 개발 서버 시작 (새 터미널)

```bash
npm start
```

### 7. 브라우저에서 확인

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

### 🏗️ 분리 배포 방식 (권장)

ADMORE는 프론트엔드와 백엔드를 분리하여 배포하는 것을 권장합니다. 이는 확장성과 유지보수성을 높이고, 각각의 서비스에 최적화된 인프라를 사용할 수 있게 합니다.

### 🚀 CloudType 풀스택 배포 (프론트엔드 + 백엔드)

CloudType에서 프론트엔드와 백엔드를 함께 배포하는 방법입니다. 이 방식은 단일 서비스로 관리할 수 있어 간단하지만, 확장성에는 제한이 있을 수 있습니다.

#### **프로젝트 설정:**

1. **프로젝트명**: `admore-fullstack`
2. **Git URL**: `https://github.com/budlpili/AdMore.git`
3. **브랜치**: `main`
4. **빌드 타입**: `Dockerfile`

#### **빌드 설정:**

```bash
# Install Command
npm ci

# Build Command
npm run build

# Start Command
npm start

# Port
3000
```

#### **환경변수 설정:**

```bash
# MongoDB Atlas 연결
MONGODB_URI=mongodb+srv://admore_user:your_password@cluster0.xxxxx.mongodb.net/admore?retryWrites=true&w=majority

# 기본 설정
NODE_ENV=production
PORT=3000
JWT_SECRET=admore_jwt_secret_key_2024_secure_version

# 이메일 설정 (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=budlpili@gmail.com
SMTP_PASS=xhcg nwfi nwvx rouu
MAIL_FROM=ADMore <budlpili@gmail.com>

# 앱 설정
APP_BASE_URL=https://your-cloudtype-domain.com
FRONTEND_URL=https://your-cloudtype-domain.com
```

#### **배포 과정:**

1. **GitHub 저장소 연결**: CloudType에서 GitHub 저장소 연결
2. **Dockerfile 사용**: 자동으로 Dockerfile 기반 빌드
3. **환경변수 설정**: MongoDB Atlas, SMTP 등 설정
4. **자동 배포**: 코드 변경 시 자동 빌드 및 배포

#### **장점:**

- **단순성**: 하나의 서비스로 관리
- **자동화**: GitHub 연동으로 자동 배포
- **통합**: 프론트엔드와 백엔드가 같은 환경에서 실행

#### **주의사항:**

- **리소스 제한**: CloudType 프리티어 제한
- **확장성**: 단일 서비스로 인한 확장 제한
- **의존성**: 프론트엔드와 백엔드가 함께 재시작

#### **1단계: 백엔드 배포 (Railway)**

##### **Railway 계정 생성:**

1. [railway.app](https://railway.app)에서 GitHub 계정으로 로그인
2. "New Project" → "Deploy from GitHub repo" 선택
3. `budlpili/AdMore` 저장소 연결

##### **백엔드 서비스 설정:**

```bash
# Build Command
npm install

# Start Command
cd backend && npm start

# Root Directory
backend/
```

##### **환경변수 설정:**

```bash
# 기본 설정
NODE_ENV=production
PORT=5001
JWT_SECRET=admore_jwt_secret_key_2024_secure_version
FRONTEND_URL=https://your-frontend-domain.com

# 데이터베이스 (Railway PostgreSQL)
DATABASE_URL=postgresql://username:password@host:port/database

# 이메일 설정
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=budlpili@gmail.com
SMTP_PASS=xhcg nwfi nwvx rouu
MAIL_FROM=ADMore <budlpili@gmail.com>
```

##### **데이터베이스 설정:**

1. Railway에서 PostgreSQL 서비스 생성
2. `DATABASE_URL` 환경변수에 연결 정보 설정
3. 백엔드 서비스와 데이터베이스 연결

#### **2단계: 프론트엔드 배포 (CloudType)**

##### **프로젝트 설정:**

1. **프로젝트명**: `admore-frontend`
2. **Git URL**: `https://github.com/budlpili/AdMore.git`
3. **브랜치**: `main`

##### **빌드 설정:**

```bash
# Install Command
npm ci

# Build Command
npm run build

# Start Command
npm start

# Port
3000
```

##### **환경변수 설정:**

```bash
# 백엔드 API 연결
REACT_APP_API_URL=https://your-backend-railway-domain.com/api
REACT_APP_WS_URL=https://your-backend-railway-domain.com

# 기타 설정
NODE_ENV=production
PORT=3000
```

##### **Health Check:**

```
/
```

#### **3단계: 도메인 연결 및 테스트**

##### **백엔드 도메인 확인:**

1. Railway 대시보드에서 백엔드 서비스 도메인 확인
2. `https://your-backend-railway-domain.com` 형태로 제공

##### **프론트엔드 도메인 확인:**

1. CloudType 대시보드에서 프론트엔드 도메인 확인
2. `https://admore-frontend.cloudtype.app` 형태로 제공

##### **연결 테스트:**

```bash
# 백엔드 API 테스트
curl https://your-backend-railway-domain.com/api/health

# 프론트엔드 접속 테스트
curl https://admore-frontend.cloudtype.app
```

### 🔧 분리 배포의 장점

#### **확장성:**

- **백엔드**: 필요에 따라 CPU/메모리 확장
- **프론트엔드**: CDN을 통한 글로벌 배포
- **데이터베이스**: 독립적인 스케일링

#### **유지보수성:**

- **백엔드**: API 버전 관리, 데이터베이스 마이그레이션
- **프론트엔드**: UI/UX 개선, 성능 최적화
- **독립적 배포**: 각각의 서비스별로 배포 일정 관리

#### **비용 효율성:**

- **백엔드**: 사용량 기반 과금
- **프론트엔드**: 정적 호스팅으로 저비용
- **리소스 최적화**: 각 서비스에 필요한 만큼만 할당

### 🚨 주의사항

#### **CORS 설정:**

- 백엔드에서 프론트엔드 도메인을 허용하도록 설정
- `FRONTEND_URL` 환경변수로 동적 설정

#### **환경변수 관리:**

- 프로덕션 환경변수는 절대 GitHub에 커밋하지 않음
- 각 배포 플랫폼의 환경변수 설정 기능 사용

#### **데이터베이스 백업:**

- 정기적인 데이터베이스 백업 설정
- 마이그레이션 스크립트 준비

### 📱 모니터링 및 로그

#### **백엔드 모니터링:**

- Railway 대시보드에서 로그 확인
- 에러 알림 설정
- 성능 메트릭 모니터링

#### **프론트엔드 모니터링:**

- CloudType 대시보드에서 빌드 상태 확인
- 사용자 접속 통계
- 에러 로그 분석

---

### CloudType 배포 (프론트엔드)

1. **프로젝트 연결**: GitHub 저장소 연결
2. **빌드 설정**: `npm run build`
3. **환경변수**: API URL, JWT Secret 등 설정
4. **배포**: 자동 빌드 및 배포

### 백엔드 배포 (Railway/Render)

1. **서비스 생성**: Railway 또는 Render 계정 생성
2. **GitHub 연결**: 백엔드 코드 저장소 연결
3. **환경변수**: 데이터베이스, SMTP 등 설정
4. **배포**: 자동 빌드 및 배포

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
