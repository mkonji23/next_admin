# Next.js Admin Dashboard

이 프로젝트는 `create-next-app`으로 구성된 Next.js 기반의 관리자 대시보드 애플리케이션입니다. React-Activation을 통한 탭 기반 UI(Tabbed View)와 PrimeReact를 활용한 풍부한 UI 컴포넌트를 제공합니다.

## 🚀 주요 기술 스택

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **UI Library:** PrimeReact, PrimeFlex, PrimeIcons
- **State Management:** Zustand
- **Backend/DB:** Supabase (Client-side usage)
- **Styling:** SCSS, CSS Modules
- **Keep-Alive:** react-activation (탭 전환 시 상태 유지)
- **Utilities:** Axios, Day.js, XLSX

## 📂 프로젝트 구조

```text
├── app/                  # Next.js 앱 라우터 (페이지 및 API)
│   ├── (main)/           # 메인 레이아웃 적용 페이지 (탭 기반)
│   ├── (full-page)/      # 전체 화면 페이지 (로그인, 공유 뷰 등)
│   └── api/              # 백엔드 API 라우트
├── components/           # 공통 React 컴포넌트 및 모달
├── constants/            # 메뉴 구성, 사용자 옵션 등 상수 관리
├── hooks/                # 커스텀 React Hooks (Auth, Toast, Confirm 등)
├── layout/               # 애플리케이션 레이아웃 및 TabbedView 구성
├── lib/                  # 외부 라이브러리 설정 (Supabase 등)
├── store/                # Zustand 상태 관리 (Auth, Tab 등)
├── styles/               # 전역 및 레이아웃 관련 SCSS
├── types/                # TypeScript 타입 정의
└── util/                 # 공통 유틸리티 (API 인스턴스, 라우트 맵 등)
```

## 🛠 실행 및 빌드 방법

이 프로젝트는 패키지 매니저로 `yarn`을 사용합니다.

### 1. 의존성 설치
```bash
yarn install
```

### 2. 개발 서버 실행
```bash
yarn dev
```
- 실행 주소: [http://localhost:4000](http://localhost:4000)

### 3. 프로덕션 빌드 및 실행
```bash
yarn build
yarn start
```

### 4. 기타 유틸리티
- **코드 포맷팅:** `yarn format`
- **린팅:** `yarn lint`
- **타입 체크:** `yarn check-types`

## ✨ 주요 기능

- **Tabbed View:** 한 화면에서 여러 메뉴를 탭으로 열고 전환할 수 있으며, `react-activation`을 통해 탭 전환 시 입력 데이터나 스크롤 위치가 유지됩니다.
- **Kakao Share:** 게시글을 작성하고 카카오톡으로 공유할 수 있는 기능을 제공하며, 공유된 이미지는 Galleria를 통해 스와이프 및 다운로드가 가능합니다.
- **Authentication:** Supabase를 연동한 로그인 및 프로필 관리 기능을 포함합니다.
- **Attendance Management:** 출석 체크 및 통계 관리 기능을 제공합니다.
