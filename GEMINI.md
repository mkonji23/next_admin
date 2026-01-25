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