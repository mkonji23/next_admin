# Next.js Admin (ChoiMath Front-End) AI Agent Harness & Context

이 문서는 Gemini / Antigravity 및 AI 에이전트가 본 프로젝트의 프론트엔드 코드를 이해하고, 수정하며, 자체 검증(Harness)할 수 있도록 정의된 표준 가이드입니다.

---

## 1. 프로젝트 개요 및 기술 스택

-   **Framework**: Next.js 15 (App Router 구조, `app/` 디렉토리 기반)
-   **UI Library**: PrimeReact 10.2.1, PrimeIcons, PrimeFlex 3.3.1
-   **Styling**:
    -   전역 SCSS (`styles/layout/layout.scss`)
    -   컴포넌트별 스타일: **CSS Modules** (`[ComponentName].module.css`) 사용 권장 (인라인 `<style>` 태그 지양)
-   **Language**: TypeScript (엄격한 타입 체크 `strict: true`, path alias `@/*`)
-   **State Management**: Zustand, React Activation (Keep-Alive 탭 시스템 `layout/TabbedView.tsx`)
-   **HTTP Client**: Axios 커스텀 훅 (`@/util/axiosInstance`의 `useHttp()`)
-   **Date Library**: `dayjs` (전역 날짜 처리 표준)

---

## 2. 하네스(Harness) 검증 및 실행 명령어

AI 에이전트는 코드 수정 후 반드시 다음 명령어를 통해 정적 타입과 빌드 무결성을 검증해야 합니다.

### 2.1 개발 서버 실행

```bash
npm run dev
# 또는 yarn dev (포트: 4000)
```

---

## 3. 핵심 디렉토리 및 아키텍처 규칙

```
next_admin/
├── app/
│   ├── (main)/             # 관리자 인증 기반 대시보드 페이지 (헤더/사이드바/메뉴 레이아웃)
│   │   ├── attendanceList/
│   │   ├── praise/         # 칭찬 현황 통계
│   │   ├── studyTimeStatistics/ # 순수 공부시간 통계
│   │   └── ...
│   ├── (full-page)/        # 전체화면 독립 페이지 (사이드바 없음)
│   │   ├── auth/login/     # 로그인
│   │   └── student-status/ # 학생 전용 현황 및 순공 모드 화면
├── components/
│   ├── modals/             # 전역/관리자 공통 팝업 모달 (@/components/modals/*, modalRegistry 연동)
│   ├── studentStatus/      # 학생 현황 & 순공 타이머 관련 컴포넌트
│   │   ├── modals/         # 학생 화면 전용 팝업 모달 (MonthlyStudyHistoryModal, ProfileSelectionDialog 등)
│   │   ├── StudyStopwatchCard.tsx       # 순공 스톱워치 메인 카드
│   │   ├── StudyRankingCard.tsx         # 오늘 순공 랭킹 리더보드 카드
│   │   └── ...
│   └── hoc/
│       └── withStudentAuth.tsx # 학생 토큰/인증 HOC
├── styles/
│   ├── modules/            # 컴포넌트별 CSS Module 전용 디렉토리 (@/styles/modules/*.module.css)
│   │   └── StudyStopwatchCard.module.css
│   └── layout/             # 전역 Sakai 레이아웃 스타일
├── constants/
│   ├── menu.ts             # 관리자 대시보드 메뉴 모델 (AppMenuModel)
│   └── ...
├── hooks/
│   ├── useStudyStopwatch.ts # 순공시간 1초 타이머 & 백엔드 동기화 훅
│   └── useToast.ts
├── layout/                 # PrimeReact Sakai 기반 레이아웃 시스템
├── store/                  # Zustand 상태 저장소
├── types/                  # TypeScript 인터페이스 정의
└── util/
    └── axiosInstance.ts    # 백엔드 API 통신 인스턴스 (인증 토큰 자동 주입)
```

---

## 4. 코딩 및 개발 컨벤션 (Agent Rules)

1. **CSS 관리**:
    - 컴포넌트 내부의 인라인 `<style>{...}</style>` 태그는 사용하지 않습니다.
    - 컴포넌트별 CSS 모듈은 `styles/modules/` 디렉토리에 모아서 `[ComponentName].module.css`로 분리하고, `@/styles/modules/[ComponentName].module.css`로 import합니다.
    - PrimeFlex 유틸리티 클래스(`flex`, `gap-2`, `surface-card`, `border-round-xl` 등)를 적극 활용합니다.
2. **다크 모드 지원**:
    - `useContext(LayoutContext)`의 `layoutConfig.colorScheme === 'dark'`를 확인하여 다크/라이트 모드 테마를 일관되게 지원합니다.
3. **API 통신 및 `useHttp()` 무한루프 방지 규칙**:
    - 항상 `@/util/axiosInstance`의 `useHttp()` 훅을 사용하여 토큰 및 baseURL이 자동 주입되도록 합니다.
    - **[주의 / 필수] `useHttp()` 의존성 배열 포함 금지**:
        - `useHttp()`는 호출될 때마다 새로운 `AxiosInstance` 객체(`axios.create`)를 반환합니다.
        - 따라서 `useEffect`나 `useCallback`의 의존성 배열(`deps`)에 `http` 객체를 그대로 넣으면:
          `상태 업데이트 ➡️ 리렌더링 ➡️ 새 http 인스턴스 생성 ➡️ useCallback/useEffect 재실행 ➡️ 무한루프`가 발생합니다.
        - **권장 해결 패턴**:
          1. `useRef` 패턴:
             ```tsx
             const http = useHttp();
             const httpRef = useRef(http);
             useEffect(() => { httpRef.current = http; }, [http]);
             // API 호출 시 httpRef.current.get(...) 사용, useCallback deps에는 studentId 등 순수 식별자만 포함!
             ```
          2. 또는 마운트 시 1회 호출인 경우 `// eslint-disable-next-line react-hooks/exhaustive-deps`를 사용하여 `http`를 deps에서 제외합니다.
    - 백엔드 통신은 `GET`과 `POST`만 사용합니다 (`PUT`, `DELETE` 사용 금지).
4. **날짜 포맷팅**:
    - 날짜 및 시간 계산/포맷팅은 반드시 `dayjs` 라이브러리를 사용합니다.
5. **문서 보존성**:
    - 기존의 주석, JSDoc, 비즈니스 로직을 임의로 제거하거나 훼손하지 않습니다.
6. **신규 관리자 페이지 추가 시 필수 등록 (Keep-Alive 탭 시스템)**:
    - `app/(main)/` 경로에 새 관리자 페이지를 추가할 경우, 반드시 [util/routeComponentMap.tsx](file:///c:/Users/min/Desktop/dev/next_admin/util/routeComponentMap.tsx)의 `routeMap`에 해당 경로와 `React.lazy` 임포트를 등록해야 탭 뷰(`TabbedView`)에서 404 에러 없이 정상 렌더링됩니다.
7. **컴포넌트(Components)와 모달(Modals) 디렉토리 분리 원칙**:
    - 화면 카드/목록/뷰 등의 순수 컴포넌트(`Card`, `Row`, `Table`, `List`)와 사용자 인터랙션 팝업(`Dialog`, `Modal`)은 반드시 디렉토리를 분리하여 관리합니다.
    - 관리자 전역 모달은 `components/modals/` 에 위치합니다 (`modalRegistry.tsx` 연동).
    - 도메인 전용 모달은 해당 도메인 폴더 내 `modals/` 디렉토리에 위치시킵니다 (예: `components/studentStatus/modals/MonthlyStudyHistoryModal.tsx`, `ProfileSelectionDialog.tsx`).
    - 메인 컴포넌트 내부에 거대한 `<Dialog>` 코드를 인라인으로 포함하지 않고 독립적인 모달 컴포넌트로 분리합니다.
8. **순공 랭킹 카드(`StudyRankingCard`) UI 및 4개 노출 규칙**:
    - 불필요한 장식 텍스트나 좌우 2열 분리 박스를 배제하고, 랭킹 리더보드 단일 리스트 뷰로 구성합니다.
    - 사용자가 TOP 3(1~3위)에 진입하지 못한 경우: **내 데이터(내 순위, 이름, 총 순공시간)를 리스트의 맨 첫 번째 라인에 노출**하고 그 뒤에 1, 2, 3위를 표시하여 **총 4개 행**을 보여줍니다.
    - 사용자가 이미 TOP 3에 든 경우: 1, 2, 3위 목록 그대로 3개를 표시하며 본인 항목에 `나` 하이라이트를 적용합니다.
