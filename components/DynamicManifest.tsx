'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const DynamicManifest = () => {
  const pathname = usePathname();

  useEffect(() => {
    // Find existing manifest link
    let link = document.querySelector('link[rel="manifest"]');
    
    // If it doesn't exist, create it
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    
    // Set the href based on the path
    let manifestHref = '/manifest-root.json';
    if (pathname === '/student-status') {
      manifestHref = '/manifest-student-status.json';
    }
    
    link.href = manifestHref;

  }, [pathname]);

  return null; // This component doesn't render anything itself
};

export default DynamicManifest;
