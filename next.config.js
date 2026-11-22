const path = require('path');

/** @type {import('next').NextConfig} */
const withPWA = require('@ducanh2912/next-pwa').default({
    dest: 'public',
    disable: false, // 현재 테스트를 위해 개발 모드에서도 켜둡니다!
    register: true,
    skipWaiting: true
});

const nextConfig = {
    outputFileTracingRoot: path.join(__dirname, './'),
    reactStrictMode: false,
    typescript: {
        // !! 주의: 타입 에러가 있어도 빌드를 강제로 진행합니다.
        // 하지만 가급적 에러를 고치는 것이 권장됩니다.
        ignoreBuildErrors: true
    },
    async rewrites() {
        const rawBackendUrl =
            process.env.NEXT_PUBLIC_BACKEND_URL ||
            (process.env.NEXT_PUBLIC_TYPE === 'dev' ? 'http://localhost:3000' : 'https://serve-less.vercel.app');
        const cleanBackendUrl = rawBackendUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

        return {
            // 기본 도메인('/') 접속 시 URL은 그대로 두고 학생 칭찬 현황 화면을 보여줌
            // (기존 관리자 화면은 /admin 으로 접속)
            beforeFiles: [
                {
                    source: '/',
                    destination: '/student-status'
                }
            ],
            afterFiles: [
                {
                    source: '/v1/api/:path*', // 클라이언트에서 호출하는 경로
                    destination: `${cleanBackendUrl}/api/:path*` // 실제 API 서버 주소 (동적 백엔드 프록시)
                }
            ]
        };
    }
};

module.exports = withPWA(nextConfig);
