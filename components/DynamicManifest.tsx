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

    const manifestHref = isStudentStatus ? '/manifest-student-status.json?v=3' : '/manifest-root.json?v=3';
    const primaryIconHref = isStudentStatus ? '/icons/icon-192x192_red.png?v=3' : '/icons/icon-192x192.png?v=3';
    const largeIconHref = isStudentStatus ? '/icons/icon-512x512_red.png?v=3' : '/icons/icon-512x512.png?v=3';

    // 1. Web App Manifest 동적 설정
    let link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    link.href = manifestHref;

    // 2. iOS Safari / Firefox 홈 화면 추가 시 사용할 apple-touch-icon 설정
    let appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null;
    if (!appleIcon) {
      appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleIcon);
    }
    appleIcon.href = largeIconHref;

    // 3. 표준 파비콘 및 바로가기 icon 태그 동적 설정 (Firefox 홈 화면 추가 fallback 대응)
    let iconLink = document.querySelector('link[rel="icon"][sizes="192x192"]') as HTMLLinkElement | null;
    if (!iconLink) {
      iconLink = document.createElement('link');
      iconLink.rel = 'icon';
      iconLink.type = 'image/png';
      iconLink.setAttribute('sizes', '192x192');
      document.head.appendChild(iconLink);
    }
    iconLink.href = primaryIconHref;

  }, [pathname]);

  return null;
};

export default DynamicManifest;
