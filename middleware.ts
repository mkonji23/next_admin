// middleware.js
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    console.log('미들어웨어', request.nextUrl.pathname);
    console.log('token정보', request.cookies.get('token')?.value);

    const response = NextResponse.next();
    // 요청에 따른 조건부 로직 처리
    if (!request.cookies.get('token')) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    return response;
}

// 특정 경로에 대해서만 middleware 적용
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|themes|layout|auth/login|demo).*)']
};
