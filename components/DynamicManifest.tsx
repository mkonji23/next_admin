'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const DynamicManifest = () => {
  const pathname = usePathname();

  useEffect(() => {
    // 1. Web App Manifest 동적 설정
    let link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    
    let manifestHref = '/manifest-root.json';
    if (pathname === '/student-status') {
      manifestHref = '/manifest-student-status.json';
    }
    link.href = manifestHref;

    // 2. iOS Safari 홈 화면 추가 시 사용할 apple-touch-icon 동적 설정
    let appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null;
    if (!appleIcon) {
      appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleIcon);
    }
    appleIcon.href = pathname === '/student-status' ? '/icons/icon-ios-1024x1024_red.png' : '/icons/icon-ios-1024x1024.png';

  }, [pathname]);

  return null;
};

export default DynamicManifest;
