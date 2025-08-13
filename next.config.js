/** @type {import('next').NextConfig} */
const nextConfig = {
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
