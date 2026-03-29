// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const response = NextResponse.next();
    // 요청에 따른 조건부 로직 처리
    if (!request.cookies.get('token')) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    return response;
}

// 특정 경로에 대해서만 middleware 적용
// kakao-share/view 를 제외 목록에 추가하여 인증 없이 접근 허용
export const config = {
    matcher: [
        '/((?!api|v1/api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest|sw.js|workbox|icons|themes|layout|auth/login|auth/kakao/callback|demo|kakao-share/view|kakao-share/public-view|student-status).*)'
    ]
};
