import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Academy Management System',
    short_name: 'AMS',
    description: '출석부',
    start_url: '/manual',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        src: '/icons/icon-ios-256x256.png',
        sizes: '256x256',
        type: 'image/png',
      },
      {
        src: '/icons/icon-mac-1024x1024.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    // 앱 아이콘을 꾹 눌렀을 때(또는 우클릭 시) 바로가기 진입점 메뉴 제공
    shortcuts: [
      {
        name: '대시보드 홈',
        short_name: '홈',
        description: '관리자 대시보드 메인으로 돌아갑니다.',
        url: '/manual',
      },
      {
        name: '학생 칭찬 현황',
        short_name: '학생 칭찬 현황',
        description: '학생 현황 화면으로 곧장 진입합니다.',
        url: '/student-status',
      }
    ]
  };
}

