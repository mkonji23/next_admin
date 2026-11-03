'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const DynamicManifest = () => {
  const pathname = usePathname();

  useEffect(() => {
    const isStudentStatus =
      pathname === '/student-status' ||
      pathname?.startsWith('/student-status') ||
      pathname === '/install/student-status';

    // 1. Web App Manifest 동적 설정 (캐시 버스팅 쿼리스트링 추가)
    let link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    
    link.href = isStudentStatus ? '/manifest-student-status.json?v=2' : '/manifest-root.json?v=2';

    // 2. iOS Safari 홈 화면 추가 시 사용할 apple-touch-icon 동적 설정
    let appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null;
    if (!appleIcon) {
      appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleIcon);
    }
    appleIcon.href = isStudentStatus ? '/icons/icon-ios-1024x1024_red.png?v=2' : '/icons/icon-ios-1024x1024.png?v=2';

  }, [pathname]);

  return null;
};

export default DynamicManifest;
