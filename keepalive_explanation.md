# `react-activation`을 이용한 탭 KeepAlive 기능 구현 원리 및 구조

이 문서는 Next.js 프로젝트에서 `react-activation` 라이브러리를 사용하여 탭 메뉴의 KeepAlive 기능을 구현한 원리와 구조를 설명합니다.

## 1. 문제 정의

기존 탭 메뉴 시스템에서는 사용자가 탭을 전환할 때마다 해당 탭의 컴포넌트가 언마운트되고 다시 마운트되는 문제가 있었습니다. 이로 인해 다음과 같은 비효율이 발생했습니다:

-   **상태 손실**: 탭을 전환할 때마다 컴포넌트의 내부 상태(예: 스크롤 위치, 폼 입력 값, 로드된 데이터)가 초기화됩니다.
-   **성능 저하**: 탭을 전환할 때마다 컴포넌트가 처음부터 다시 렌더링되므로 불필요한 리소스가 소모되고 사용자 경험이 저하됩니다.

`react-activation`은 이러한 문제를 해결하여 탭 전환 시 컴포넌트의 상태를 유지하고 불필요한 리렌더링을 방지하는 KeepAlive 기능을 제공합니다.

## 2. `react-activation` 개요

`react-activation`은 React 컴포넌트의 상태를 유지하고 비활성 상태일 때도 DOM에 마운트된 상태로 유지하는 기능을 제공하는 라이브러리입니다. 주요 컴포넌트 및 훅은 다음과 같습니다:

-   **`<AliveScope>`**: KeepAlive 기능을 활성화하는 Provider 컴포넌트입니다. KeepAlive 기능을 사용하려는 모든 컴포넌트의 상위에 위치해야 합니다.
-   **`<KeepAlive>`**: 상태를 유지하려는 컴포넌트를 감싸는 래퍼 컴포넌트입니다. `name` prop을 통해 고유한 식별자를 부여하여 해당 컴포넌트의 상태를 관리합니다.
-   **`useAliveController()`**: KeepAlive 컴포넌트의 생명주기를 제어하는 훅입니다. 주로 `drop` 함수를 사용하여 캐시된 컴포넌트를 수동으로 제거할 때 사용됩니다.

## 3. 구현 세부 사항

### `app/(main)/layout.tsx`

`app/(main)/layout.tsx` 파일은 애플리케이션의 메인 레이아웃을 정의합니다. 이곳에서 `TabbedView` 컴포넌트를 `<AliveScope>`로 감싸서 KeepAlive 기능이 전역적으로 활성화되도록 합니다.

```typescript
// app/(main)/layout.tsx
import { AliveScope } from 'react-activation';
// ...
export default function AppLayout({ children }: AppLayoutProps) {
    // ...
    return (
        <Layout>
            <AliveScope>
                <TabbedView initialTab={initialTab} />
            </AliveScope>
        </Layout>
    );
}
```

`AliveScope`는 `TabbedView` 내부에서 렌더링되는 모든 `KeepAlive` 컴포넌트의 캐싱 메커니즘을 관리합니다.

### `layout/TabbedView.tsx`

`layout/TabbedView.tsx` 파일은 실제 탭 메뉴와 탭 콘텐츠를 렌더링하는 핵심 컴포넌트입니다.

1.  **`KeepAlive` 및 `useAliveController` 임포트**:
    ```typescript
    import { KeepAlive, useAliveController } from 'react-activation';
    ```

2.  **`useAliveController`를 통한 `drop` 함수 사용**:
    `TabbedView` 컴포넌트 내에서 `useAliveController` 훅을 사용하여 `drop` 함수를 가져옵니다. 이 `drop` 함수는 탭이 닫힐 때 해당 탭의 캐시된 상태를 명시적으로 제거하는 데 사용됩니다.

    ```typescript
    const TabbedView = ({ initialTab }: TabbedViewProps) => {
        // ...
        const { drop } = useAliveController();

        const closeTab = (e: React.MouseEvent, tabId: string) => {
            e.stopPropagation();
            drop(tabId); // 탭 닫기 전에 해당 탭의 KeepAlive 캐시를 제거
            removeTab(tabId); // Zustand 스토어에서 탭 제거
        };
        // ...
    };
    ```

3.  **`KeepAlive`로 탭 콘텐츠 감싸기**:
    각 탭의 동적 콘텐츠(`getComponentForPath(tab.path)`)는 `<KeepAlive>` 컴포넌트로 감싸집니다. 이때 `tab.id`를 `name` prop으로 사용하여 각 탭에 고유한 식별자를 부여합니다. 이는 `react-activation`이 각 탭의 상태를 개별적으로 관리할 수 있도록 합니다.

    ```typescript
    return (
        <div>
            {/* ... TabMenu ... */}
            <div className="p-4">
                {tabs.map((tab) => {
                    return (
                        <div key={tab.id} style={{ display: activeTab === tab.id ? 'block' : 'none' }}>
                            <KeepAlive name={tab.id}>
                                <Suspense fallback={<ProgressSpinner />}>{getComponentForPath(tab.path)}</Suspense>
                            </KeepAlive>
                        </div>
                    );
                })}
            </div>
        </div>
    );
    ```
    여기서 중요한 점은 모든 탭 콘텐츠가 `map` 함수 내에서 렌더링되며, `display: activeTab === tab.id ? 'block' : 'none'` 스타일을 사용하여 활성 탭만 보이도록 하고 비활성 탭은 숨긴다는 것입니다. 이 방식은 컴포넌트를 DOM에서 완전히 제거하지 않고 `display` 속성만 변경하므로, `KeepAlive` 컴포넌트가 항상 마운트된 상태를 유지하게 되어 상태가 보존됩니다.

### `TabbedView`의 `children` prop 제거 및 통합

**기존 `children` prop의 역할:**

`TabbedView` 컴포넌트는 초기 구현에서 `children` prop을 받았습니다. 이 `children`은 `app/(main)/layout.tsx`에서 전달되는 기본 페이지 콘텐츠(예: `/` 경로에 해당하는 `app/(main)/page.tsx`)를 나타냈습니다. 이는 애플리케이션이 처음 로드되거나 다른 탭이 활성화되지 않았을 때 기본 화면을 표시하는 역할을 했습니다.

```typescript
// app/(main)/layout.tsx (이전 코드)
<TabbedView initialTab={initialTab}>{children}</TabbedView>
```
그리고 `TabbedView` 내부에서는 이 `children`을 별도의 `div`로 렌더링했습니다.

```typescript
// layout/TabbedView.tsx (이전 코드)
<div style={{ display: activeTab === initialTab.id ? 'block' : 'none' }}>{children}</div>
```

**`children` prop 제거 및 통합 이유:**

`react-activation`의 KeepAlive 기능을 모든 탭 콘텐츠에 일관되게 적용하기 위해 `children` prop을 제거하고 통합하는 변경이 필요했습니다.

1.  **KeepAlive 일관성 유지**: 이전 구현에서는 `children` prop으로 렌더링되는 기본 페이지 콘텐츠가 `<KeepAlive>` 컴포넌트로 감싸져 있지 않았습니다. 이로 인해 사용자가 기본 페이지에서 다른 탭으로 이동했다가 다시 돌아올 경우, 기본 페이지의 상태가 보존되지 않고 처음부터 다시 렌더링되는 문제가 발생했습니다.
2.  **렌더링 로직의 통일**: `TabbedView` 내에서 동적으로 추가되는 탭들은 `<KeepAlive>`로 감싸져 관리되었지만, `children`은 별도로 처리되어 렌더링 로직이 이원화되어 있었습니다. `children`을 제거하고 모든 탭 콘텐츠(기본 페이지 포함)를 `useTabStore`의 `tabs` 배열을 통해 관리하고 `getComponentForPath` 함수로 가져와 `<KeepAlive>`로 감싸도록 변경함으로써, 모든 탭 콘텐츠에 대한 렌더링 및 상태 관리 로직이 통일되었습니다.

**새로운 접근 방식:**

이제 `TabbedView`는 `children` prop을 받지 않으며, `initialTab`을 포함한 모든 탭은 `useTabStore`에 의해 관리되는 `tabs` 배열의 일부로 간주됩니다. `getComponentForPath` 함수를 통해 각 탭에 해당하는 컴포넌트를 가져오고, 이를 `<KeepAlive>`로 감싸서 렌더링합니다. 이로써 기본 페이지 또한 다른 동적 탭과 동일하게 KeepAlive의 혜택을 받아 상태가 보존됩니다.

```typescript
// app/(main)/layout.tsx (변경 후)
<TabbedView initialTab={initialTab} /> // children prop 제거
```
```typescript
// layout/TabbedView.tsx (변경 후 - 탭 콘텐츠 렌더링 부분)
{tabs.map((tab) => {
    return (
        <div key={tab.id} style={{ display: activeTab === tab.id ? 'block' : 'none' }}>
            <KeepAlive name={tab.id}>
                <Suspense fallback={<ProgressSpinner />}>{getComponentForPath(tab.path)}</Suspense>
            </KeepAlive>
        </div>
    );
})}
```
이러한 변경을 통해 `react-activation`의 KeepAlive 기능이 애플리케이션의 모든 탭 콘텐츠에 대해 일관되고 효과적으로 작동하도록 보장합니다.

### `util/routeComponentMap.tsx`

이 파일은 경로에 따라 해당하는 페이지 컴포넌트를 동적으로 가져오는 역할을 합니다. `React.lazy`를 사용하여 컴포넌트를 지연 로드하며, 이는 코드 스플리팅에 유용합니다.

```typescript
// util/routeComponentMap.tsx
import React, { ReactNode } from 'react';

const routeMap: { [key: string]: React.LazyExoticComponent<React.ComponentType<any>> } = {
    '/': React.lazy(() => import('@/app/(main)/page')),
    '/attendanceList': React.lazy(() => import('@/app/(main)/attendanceList/page')),
    // ...
};

export const getComponentForPath = (path: string): React.ReactNode => {
    const Component = routeMap[path];
    return Component ? <Component /> : <div>페이지를 찾을 수 없습니다: {path}</div>;
};
```
`getComponentForPath` 함수는 `React.lazy`로 로드된 컴포넌트의 인스턴스를 반환하며, 이 인스턴스가 `KeepAlive` 컴포넌트 내부에 렌더링됩니다.

## 4. 문제 해결 원리

위와 같은 구조를 통해 `react-activation`은 다음과 같은 방식으로 KeepAlive 기능을 구현합니다:

1.  **컴포넌트 마운트 유지**: 탭 전환 시 비활성 탭의 컴포넌트가 DOM에서 완전히 언마운트되지 않고 `display: none` 스타일로 숨겨집니다. 이로 인해 컴포넌트의 내부 상태(useState, useRef 등)와 DOM 상태가 그대로 유지됩니다.
2.  **캐싱 메커니즘**: `KeepAlive` 컴포넌트는 `name` prop으로 식별되는 각 자식 컴포넌트의 인스턴스를 내부적으로 캐시합니다. 사용자가 탭을 다시 활성화하면, `react-activation`은 캐시된 인스턴스를 재사용하여 불필요한 리렌더링을 방지하고 이전에 유지된 상태를 복원합니다.
3.  **명시적 제거**: `useAliveController`의 `drop` 함수를 사용하여 탭이 닫힐 때 해당 탭의 캐시된 상태를 명시적으로 제거함으로써 메모리 누수를 방지하고 리소스를 효율적으로 관리합니다.

이러한 방식으로, 사용자는 탭을 전환하더라도 각 탭의 내용이 빠르게 로드되고 이전에 작업하던 상태가 그대로 유지되는 부드러운 사용자 경험을 얻을 수 있습니다.