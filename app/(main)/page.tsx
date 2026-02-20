'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const Dashboard = () => {
    const router = useRouter();

    useEffect(() => {
        // 루트 경로 접근 시 출석 현황 통계로 리다이렉트
        router.replace('/attendanceList');
    }, [router]);

    return null;
};

export default Dashboard;
