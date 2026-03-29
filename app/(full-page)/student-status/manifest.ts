import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '학생 출석/칭찬 현황',
    short_name: '내 현황',
    description: '학생의 출석 및 칭찬 현황을 확인할 수 있는 개인 페이지입니다.',
    start_url: '/student-status',
    display: 'standalone',
    background_color: '#f8f9fa',
    theme_color: '#4f46e5', // 학생용 테마 컬러 지정 (인디고 톤)
    icons: [
      {
        src: '/icons/icon-mac-256x256.png',
        sizes: '256x256',
        type: 'image/png',
      },
      {
        src: '/icons/icon-ios-1024x1024.png',
        sizes: '1024x1024',
        type: 'image/png',
      },
    ],
  };
}
