// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const response = NextResponse.next();
    // 루트(/)는 학생 칭찬 현황(student-status)으로 연결되므로 인증 없이 접근 허용
    if (request.nextUrl.pathname === '/') {
        return response;
    }
    // 요청에 따른 조건부 로직 처리
    if (!request.cookies.get('token')) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    return response;
}

// 특정 경로에 대해서만 middleware 적용
// kakao-share/view, student-status, install 을 제외 목록에 추가하여 인증 없이 접근 허용
// (루트 '/' 는 위 middleware 함수에서 별도 허용, 관리자 화면은 /admin 으로 접속)
export const config = {
    matcher: [
        '/((?!api|v1/api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest|sw.js|workbox|icons|themes|layout|auth/login|auth/kakao/callback|demo|kakao-share/view|kakao-share/public-view|student-status|install).*)'
    ]
};
