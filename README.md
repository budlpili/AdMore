# 애드모어 - React & TypeScript & Tailwind CSS

## 🚀 주요 기능

- **홈페이지**: 히어로 섹션, 최근 본 상품, 인기 상품, 전체 상품
- **상품 페이지**: 카테고리별 필터링, 정렬 기능, 상품 그리드
- **회원가입**: 폼 검증, 약관 동의
- **고객센터**: 공지사항, 1:1 문의, FAQ
- **리뷰 페이지**: 즐겨찾기, 최근 본 상품 관리
- **About 페이지**: 회사 소개, 서비스 영역, 핵심 가치

## 🛠 기술 스택

- **Frontend**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Build Tool**: Create React App

## 📦 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm start
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하여 확인할 수 있습니다.

### 3. 빌드

```bash
npm run build
```

## 📁 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── Header.tsx      # 헤더 컴포넌트
│   └── Footer.tsx      # 푸터 컴포넌트
├── pages/              # 페이지 컴포넌트
│   ├── Home.tsx        # 홈페이지
│   ├── Products.tsx    # 상품 페이지
│   ├── SignUp.tsx      # 회원가입 페이지
│   ├── CustomerService.tsx # 고객센터 페이지
│   ├── Reviews.tsx     # 리뷰 페이지
│   └── About.tsx       # About 페이지
├── types/              # TypeScript 타입 정의
│   └── index.ts        # 공통 타입 정의
├── App.tsx             # 메인 앱 컴포넌트
├── index.tsx           # 앱 진입점
└── index.css           # 글로벌 스타일
```

## 🎨 주요 페이지 설명

### 홈페이지 (`/`)

- 히어로 섹션과 소개
- 최근 본 상품 (현재는 빈 상태)
- 카테고리별 필터링
- 인기 상품 및 전체 상품 그리드

### 상품 페이지 (`/products`)

- 카테고리별 필터링 (페이스북, 인스타그램, 유튜브 등)
- 정렬 기능 (인기순, 가격순)
- 상품 카드 그리드 레이아웃

### 회원가입 (`/signup`)

- 이메일, 비밀번호, 이름, 전화번호 입력
- 폼 검증 (이메일 형식, 비밀번호 확인 등)
- 약관 동의 체크박스

### 고객센터 (`/customer-service`)

- 공지사항 탭
- 1:1 문의 폼
- FAQ 섹션

### 리뷰 페이지 (`/reviews`)

- 즐겨찾기 탭
- 최근 본 상품 탭
- 추천 상품 섹션

### About 페이지 (`/about`)

- 회사 소개
- 서비스 영역
- 회사 정보
- 미션 & 비전
- 핵심 가치

## 🔧 TypeScript 타입 정의

### 주요 인터페이스

```typescript
// 상품 타입
interface Product {
  id: number;
  name: string;
  price: number | string;
  category: string;
  image: string;
  popular?: boolean;
  addedDate?: string;
  viewedDate?: string;
}

// 공지사항 타입
interface Notice {
  id: number;
  title: string;
  date: string;
  important: boolean;
}

// 문의 폼 타입
interface InquiryForm {
  name: string;
  email: string;
  phone: string;
  category: string;
  subject: string;
  message: string;
}

// 회원가입 폼 타입
interface SignUpForm {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
  agreeMarketing: boolean;
}
```

## 🔧 커스터마이징

### 색상 변경

`tailwind.config.js`에서 기본 색상을 수정할 수 있습니다:

```javascript
theme: {
  extend: {
    colors: {
      primary: '#3B82F6',    // 메인 색상
      secondary: '#1F2937',  // 보조 색상
    },
  },
},
```

### 상품 데이터 수정

각 페이지의 mock 데이터를 수정하여 실제 상품 정보로 변경할 수 있습니다.

## 📱 반응형 디자인

모든 페이지는 모바일, 태블릿, 데스크톱에 최적화되어 있습니다:

- 모바일: 1열 그리드
- 태블릿: 2열 그리드
- 데스크톱: 4열 그리드

## 🚀 배포

### Netlify 배포

1. GitHub에 코드 푸시
2. Netlify에서 GitHub 저장소 연결
3. 빌드 명령어: `npm run build`
4. 배포 디렉토리: `build`

### Vercel 배포

1. Vercel CLI 설치: `npm i -g vercel`
2. 프로젝트 루트에서: `vercel`

## 📄 라이선스

이 프로젝트는 학습 목적으로 제작되었습니다.

## 🤝 기여

버그 리포트나 기능 제안은 이슈로 등록해주세요.

---
