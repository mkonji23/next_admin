import React from 'react';
import { Metadata } from 'next';
import StudentStatusContent from '@/components/studentStatus/StudentStatusContent';

export const metadata: Metadata = {
    title: '나의 칭찬 현황 보기',
    description: '칭찬, 출석현황 그리고 평가메시지를 확인하세요!',
    openGraph: {
        title: '나의 칭찬 현황 보기',
        description: '칭찬, 출석현황 그리고 평가메시지를 확인하세요!',
        type: 'website'
    }
};

export default function StudentStatusPage() {
    return <StudentStatusContent />;
}
