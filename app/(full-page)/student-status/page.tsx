import React from 'react';
import { Metadata } from 'next';
import StudentStatusContent from '@/components/studentStatus/StudentStatusContent';

export const metadata: Metadata = {
    title: '나의 칭찬 현황 보기',
    description: '칭찬, 출석현황 그리고 평가메시지를 확인하세요!',
    manifest: '/manifest-student-status.json',
    appleWebApp: {
        capable: true,
        title: '칭찬현황',
        statusBarStyle: 'default'
    },
    icons: {
        icon: [
            { url: '/icons/icon-192x192_red.png', sizes: '192x192', type: 'image/png' },
            { url: '/icons/icon-512x512_red.png', sizes: '512x512', type: 'image/png' },
            { url: '/icons/icon-ios-1024x1024_red.png', sizes: '1024x1024', type: 'image/png' }
        ],
        apple: [
            { url: '/icons/icon-192x192_red.png', sizes: '192x192', type: 'image/png' },
            { url: '/icons/icon-512x512_red.png', sizes: '512x512', type: 'image/png' },
            { url: '/icons/icon-ios-1024x1024_red.png', sizes: '1024x1024', type: 'image/png' }
        ]
    },
    openGraph: {
        title: '나의 칭찬 현황 보기',
        description: '칭찬, 출석현황 그리고 평가메시지를 확인하세요!',
        type: 'website',
        images: [
            {
                url: 'https://chochomath.vercel.app/layout/images/bae.jpg',
                width: 256,
                height: 256,
                alt: '칭찬 현황 대표 이미지'
            }
        ]
    }
};

export default function StudentStatusPage() {
    return <StudentStatusContent />;
}
