'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 관리자 진입 경로 (/admin). 기존 루트(/) 동작과 동일하게 사용 매뉴얼로 이동
const AdminHome = () => {
    const router = useRouter();

    useEffect(() => {
        router.replace('/manual');
    }, [router]);

    return null;
};

export default AdminHome;
