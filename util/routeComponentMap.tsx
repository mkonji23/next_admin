import React, { ReactNode } from 'react';

// page.tsx 파일들을 동적으로 가져오기 위해 React.lazy를 사용합니다.
// 각 페이지 컴포넌트를 lazy-load 하여 초기 로딩 성능을 최적화할 수 있습니다.

const routeMap: { [key: string]: React.LazyExoticComponent<React.ComponentType<any>> } = {
    '/': React.lazy(() => import('@/app/(main)/page')),
    '/attendanceList': React.lazy(() => import('@/app/(main)/attendanceList/page')),
    '/studentAttendanceStatistics': React.lazy(() => import('@/app/(main)/studentAttendanceStatistics/page')),
    '/praise': React.lazy(() => import('@/app/(main)/praise/page')),
    '/studyTimeStatistics': React.lazy(() => import('@/app/(main)/studyTimeStatistics/page')),
    '/attendance': React.lazy(() => import('@/app/(main)/attendance/page')),
    '/weekSchedule': React.lazy(() => import('@/app/(main)/weekSchedule/page')),
    '/scoreList': React.lazy(() => import('@/app/(main)/scoreList/page')),
    '/userList': React.lazy(() => import('@/app/(main)/userList/page')),
    '/studentList': React.lazy(() => import('@/app/(main)/studentList/page')),
    '/classList': React.lazy(() => import('@/app/(main)/classList/page')),
    '/kakao-share': React.lazy(() => import('@/app/(main)/kakao-share/[[...id]]/page')),
    '/kakao-share-template': React.lazy(() => import('@/app/(main)/kakao-share-template/page')),
    '/manual': React.lazy(() => import('@/app/(main)/manual/page')),
    '/dash': React.lazy(() => import('@/app/(main)/dash/page')),
    '/profile': React.lazy(() => import('@/app/(main)/profile/page')),
    '/assistantTodo': React.lazy(() => import('@/app/(main)/assistantTodo/page')),
    '/admin-student-status': React.lazy(() => import('@/app/(main)/admin-student-status/page')),
    '/praise-settlement': React.lazy(() => import('@/app/(main)/praise-settlement/page')),
    '/notice': React.lazy(() => import('@/app/(main)/notice/[[...id]]/page')),
    '/system-log': React.lazy(() => import('@/app/(main)/system-log/page')),
    '/system-usage': React.lazy(() => import('@/app/(main)/system-usage/page')),
    '/daily-log-report': React.lazy(() => import('@/app/(main)/daily-log-report/page'))
};

export const getComponentForPath = (path: string): React.ReactNode => {
    // Exact match check
    let Component = routeMap[path];

    // Dynamic match check (e.g., /kakao-share/67e2...)
    if (!Component) {
        const baseRoutes = ['/kakao-share', '/notice'];
        for (const base of baseRoutes) {
            if (path.startsWith(`${base}/`)) {
                Component = routeMap[base];
                break;
            }
        }
    }

    return Component ? <Component path={path} /> : <div>페이지를 찾을 수 없습니다: {path}</div>;
};

export default routeMap;
