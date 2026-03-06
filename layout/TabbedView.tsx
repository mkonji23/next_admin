'use client';

import React, { useEffect, Suspense, useState } from 'react';
import { TabMenu } from 'primereact/tabmenu';
import { MenuItem } from 'primereact/menuitem';
import { useTabStore } from '@/store/useTabStore';
import { getComponentForPath } from '@/util/routeComponentMap';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useRouter, usePathname } from 'next/navigation';
import { KeepAlive, useAliveController } from 'react-activation';

interface TabbedViewProps {
    initialTab: {
        id: string;
        label: string;
        path: string;
    };
    children: React.ReactNode; // children prop은 더 이상 직접 렌더링되지 않습니다.
}

const TabbedView = ({ initialTab }: TabbedViewProps) => { // children prop 제거
    console.log('TabbedView rendered');
    const { tabs, activeTab, addTab, removeTab, setActiveTab } = useTabStore();
    const [activeIndex, setActiveIndex] = useState(0);
    const router = useRouter();
    const currentPathname = usePathname();
    const { drop } = useAliveController();

    useEffect(() => {
        // 초기 탭 추가
        addTab(initialTab);
        // 초기 로드 시 URL을 initialTab의 경로로 설정
        if (currentPathname !== initialTab.id) {
            router.replace(initialTab.id);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const tabIdx = tabs.findIndex((item) => item.id === activeTab);
        setActiveIndex(tabIdx);
    }, [activeTab, tabs]);

    // URL 변경 (브라우저 뒤로/앞으로 가기) 감지 및 탭 활성화
    useEffect(() => {
        if (currentPathname && currentPathname !== activeTab) {
            const tabExists = tabs.some(tab => tab.id === currentPathname);
            if (tabExists) {
                setActiveTab(currentPathname);
            } else if (currentPathname === initialTab.id) {
                setActiveTab(initialTab.id);
            } else {
                // URL이 어떤 탭에도 해당하지 않으면, 기본 탭으로 리다이렉트하거나 처리
                router.replace(initialTab.id);
                setActiveTab(initialTab.id);
            }
        }
    }, [currentPathname, tabs, initialTab.id, setActiveTab, router]);

    const onTabChange = (e: { value: MenuItem; index: number }) => {
        if (e.value && e.value.id) {
            setActiveTab(e.value.id);
            router.replace(e.value.id);
        }
    };

    const closeTab = (e: React.MouseEvent, tabId: string) => {
        e.stopPropagation();
        drop(tabId);
        removeTab(tabId);
    };

    const menuItems: MenuItem[] = tabs.map((tab, index) => ({
        id: tab.id,
        label: tab.label,
        tabIndex: index,
        template: (item, options) => (
            <div
                className={options.className}
                onClick={options.onClick}
                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            >
                {item.label}
                <i
                    className="pi pi-times"
                    style={{ marginLeft: '8px', cursor: 'pointer' }}
                    onClick={(e) => closeTab(e, tab.id)}
                />
            </div>
        )
    }));

    return (
        <div>
            {tabs.length > 0 && <TabMenu model={menuItems} activeIndex={activeIndex} onTabChange={onTabChange} />}
            <div className="p-4">
                {tabs.map((tab) => {
                    console.log(`Rendering tab content for: ${tab.id}, active: ${activeTab === tab.id}`);
                    return (
                        <div key={tab.id} style={{ display: activeTab === tab.id ? 'block' : 'none' }}>
                            <KeepAlive name={tab.id}>
                                <Suspense fallback={<ProgressSpinner />}>{getComponentForPath(tab.path)}</Suspense>
                            </KeepAlive>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TabbedView;

