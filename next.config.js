/** @type {import('next').NextConfig} */
const withPWA = require('@ducanh2912/next-pwa').default({
    dest: 'public',
    // disable: process.env.NODE_ENV === 'development', // 현재 테스트를 위해 개발 모드에서도 켜둡니다!
    register: true,
    skipWaiting: true
});

const nextConfig = {
    reactStrictMode: false,
    typescript: {
        // !! 주의: 타입 에러가 있어도 빌드를 강제로 진행합니다.
        // 하지만 가급적 에러를 고치는 것이 권장됩니다.
        ignoreBuildErrors: true
    },
    async rewrites() {
        return [
            {
                source: '/v1/api/:path*', // 클라이언트에서 호출하는 경로
                destination: 'http://localhost:3000/api/:path*' // 실제 API 서버 주소
            }
        ];
    }
};

module.exports = withPWA(nextConfig);
