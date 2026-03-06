'use client';
import { AppMenuModel } from '@/constants/menu';
import Layout from '../../layout/layout';
import TabbedView from '@/layout/TabbedView';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { AppMenuItem } from '@/types';
import { AliveScope } from 'react-activation';
interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    const pathName = usePathname();
    const model = AppMenuModel; // 상수 사용
    const getTabInfo = () => {
        for (const item of model) {
            const found = item?.items?.find((item2) => item2.to === pathName);
            if (found) return found;
        }
        const defaultManualTab: AppMenuItem = {
            label: '사용 매뉴얼',
            to: '/manual'
        };
        return defaultManualTab;
    };

    const tabInfo = getTabInfo();
    // 초기 탭은 보통 대시보드 또는 기본 페이지입니다.
    const initialTab = {
        id: tabInfo?.to || '',
        label: tabInfo?.label || '',
        path: tabInfo?.to || ''
    };

    return (
        <Layout>
            <AliveScope>
                <TabbedView initialTab={initialTab} />
            </AliveScope>
        </Layout>
    );
}
