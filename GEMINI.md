# 프로젝트 개요

이 프로젝트는 `create-next-app`으로 부트스트랩된 Next.js 프로젝트입니다. React와 TypeScript로 빌드되었으며, UI 컴포넌트로는 PrimeReact, 상태 관리에는 Zustand, 백엔드 서비스로는 Supabase를 활용합니다. 파일 구조와 의존성을 볼 때 관리자 대시보드 또는 애플리케이션으로 보입니다.

## 빌드 및 실행

이 프로젝트는 패키지 매니저로 `yarn`을 사용합니다.

-   **개발 환경 실행:**
    개발 서버를 실행하려면 다음 명령어를 사용하세요:

    ```bash
    yarn dev
    ```

    이 명령어는 `http://localhost:4000`에서 애플리케이션을 시작합니다.

-   **프로덕션 빌드:**
    프로덕션용으로 프로젝트를 빌드하려면 다음 명령어를 사용하세요:

    ```bash
    yarn build
    ```

-   **프로덕션 시작:**
    빌드 후 프로덕션 서버를 시작하려면 다음 명령어를 사용하세요:

    ```bash
    yarn start
    ```

    이 명령어 또한 `http://localhost:4000`에서 애플리케이션을 시작합니다.

-   **코드 포맷팅:**
    Prettier 규칙에 따라 코드를 포맷하려면 다음 명령어를 사용하세요:

    ```bash
    yarn format
    ```

-   **린팅:**
    ESLint로 코드를 린팅하려면 다음 명령어를 사용하세요:

    ```bash
    yarn lint
    ```

-   **타입 검사:**
    TypeScript 타입 검사를 수행하려면 다음 명령어를 사용하세요:
    ```bash
    yarn check-types
    ```

## 개발 컨벤션

-   **언어:** TypeScript
-   **프레임워크:** Next.js, React
-   **스타일링:** SCSS (`styles/layout/*.scss` 파일 기반) 및 PrimeFlex
-   **UI 라이브러리:** PrimeReact
-   **상태 관리:** Zustand
-   **백엔드/데이터베이스:** Supabase (`@supabase/supabase-js` 의존성으로 확인)
-   **API 호출:** Axios (`axios` 의존성으로 확인)
-   **코드 포맷팅:** Prettier (`.prettierrc.json` 및 `package.json` 스크립트에 설정)
-   **린팅:** ESLint (`.eslintrc.json` 및 `package.json` 스크립트에 설정)
-   **디렉토리 구조:** `app` 디렉토리는 `(full-page)`, `(main)`과 같은 라우트 그룹을 사용하는 Next.js의 앱 라우터 구조를 따릅니다. API 라우트는 `app/api` 아래에 정의됩니다. 또한 `demo`, `hooks`, `layout`, `lib`, `public`, `store`, `styles`, `types`, `util` 디렉토리가 있어 모듈화되고 잘 정리된 코드베이스임을 시사합니다.

-   참조파일 api.md 사용 대용량 텍스트입력부분

## manul update

-   AppMenu.tsx 기준으로 업데이트 한다.

    // 참고: AppMenu.tsx에 정의된 다른 모든 경로들을 여기에 추가해야 합니다.

## 디렉토리별 메뉴 구성 현황 및 구현 방식

이 프로젝트의 화면은 크게 관리자 사이드바 뷰를 포함하는 `(main)`과 단독 뷰로 동작하는 `(full-page)` 영역으로 나뉘어 관리됩니다. 공용되는 컴포넌트는 `components` 내부에서 별도 구현 후 각각 가져와 사용하는 방식을 따릅니다.

### 1. `app/(main)` 영역 (관리자 대시보드 및 탭 레이아웃 적용)
- **대상:** 시스템을 관리하는 학원장, 선생님, 조교용 페이지.
- **특징:**
  - `layout/AppMenu.tsx` (및 `constants/menu.ts`)에 의해 네비게이션이 노출 및 제어됩니다.
  - `util/routeComponentMap.tsx`에 경로와 컴포넌트를 명시하여 커스텀 탭 매니저에 의해 맵핑됩니다.
- **주요 메뉴 구성 (메뉴 트리 기준):**
  - **Statistics:** `/attendanceList`(출석 통계), `/studentAttendanceStatistics`(학생별 분석), `/praise`(칭찬 현황)
  - **Attendance:** `/attendance`(출석부), `/weekSchedule`(주간 스케줄), `/assistantTodo`(일자별 업무)
  - **Share:** `/kakao-share`, `/settings/kakao`
  - **Settings:** `/studentList`, `/classList`, `/userList`
  - **Fullpage (Admin):** `/admin-student-status` (학생 본인 현황을 어드민 메뉴 내에서 조회하기 라우트)

### 2. `app/(full-page)` 영역 (단독 뷰 레이아웃 적용)
- **대상:** 주로 로그인, 외부 제공 화면 또는 학생/학부모 전용 페이지.
- **특징:**
  - 관리자 사이드바나 탭이 랜더링되지 않으며 화면 전체를 씁니다.
  - `middleware.ts` 내부의 정규표현식(`! ...`)에 예외 항목으로 등록하여 토큰 없이 접근할 수 있게 구성해야 합니다.
- **주요 경로 구성:**
  - `/auth/login` : 어드민 인증 수단
  - `/student-status` : 학생 칭찬/출석 현황 외부 조회 뷰. 인증 시 `withStudentAuth` HOC를 통해 학생/학부모를 구별하여 진입을 허용.

### 3. 공유/재활용 뷰의 컴포넌트 분리 (Implementation method)
- 특정 화면을 관리자는 `(main)`으로 보고, 학생은 `(full-page)`로 접근하여 봐야 하는 경우에는 동일 코드를 중복 작성하지 않습니다.
- **구현 방식:**
  - UI 렌더링 코드는 `components/` 하위(예: `components/studentStatus/StudentStatusContent.tsx`)에 컴포넌트화 시켜 완전한 기능을 갖추도록 개발합니다.
  - 각각의 그룹(`./app/(main)/라우팅/page.tsx`와 `./app/(full-page)/라우팅/page.tsx`)에서는 해당 공통 컴포넌트만을 import 하여 `return <StudentStatusContent />;` 형태로 불러와 일관성을 유지하도록 설계합니다.
