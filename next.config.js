/** @type {import('next').NextConfig} */
const nextConfig = {
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

module.exports = nextConfig;
