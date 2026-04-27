'use client';

import React, { useEffect, Suspense, useState, useRef } from 'react';
import { TabMenu } from 'primereact/tabmenu';
import { MenuItem } from 'primereact/menuitem';
import { Button } from 'primereact/button';
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
}

const TabbedView = ({ initialTab }: TabbedViewProps) => {
    // children prop 제거
    const { tabs, activeTab, addTab, removeTab, setActiveTab, reorderTabs, clearTabs } = useTabStore();
    const [activeIndex, setActiveIndex] = useState(0);
    const [draggedTabIndex, setDraggedTabIndex] = useState<number | null>(null);
    const router = useRouter();
    const currentPathname = usePathname();
    const { drop } = useAliveController();
    const scrollRef = useRef<HTMLDivElement>(null);

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

    // 활성 탭으로 자동 스크롤
    useEffect(() => {
        if (scrollRef.current && activeIndex !== -1) {
            const container = scrollRef.current;
            // nth-child는 1부터 시작하므로 activeIndex + 1
            const activeTabElement = container.querySelector(`.p-tabmenuitem:nth-child(${activeIndex + 1})`);
            if (activeTabElement) {
                activeTabElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
            }
        }
    }, [activeIndex]);

    // URL 변경 (브라우저 뒤로/앞으로 가기) 감지 및 탭 활성화
    useEffect(() => {
        if (currentPathname && currentPathname !== activeTab) {
            const tabExists = tabs.some((tab) => tab.id === currentPathname);
            if (tabExists) {
                setActiveTab(currentPathname);
            } else if (currentPathname === initialTab.id) {
                setActiveTab(initialTab.id);
            } else {
                // URL이 어떤 탭에도 해당하지 않으면, 유효한 경로인지 확인 후 탭 추가
                const component = getComponentForPath(currentPathname);
                // getComponentForPath returns a "Not Found" div if it doesn't match
                const isNotFound =
                    React.isValidElement(component) &&
                    typeof component.props?.children === 'string' &&
                    component.props.children.includes('페이지를 찾을 수 없습니다');

                if (!isNotFound && currentPathname.split('/').pop()) {
                    // 유효한 경로면 탭 추가
                    let label = currentPathname.split('/').pop() || '페이지';
                    if (currentPathname.startsWith('/notice/')) label = '공지사항 상세';

                    addTab({
                        id: currentPathname,
                        label: label,
                        path: currentPathname
                    });
                } else {
                    router.replace(initialTab.id);
                    setActiveTab(initialTab.id);
                }
            }
        }
    }, [currentPathname, tabs, initialTab.id, setActiveTab, router, addTab]);

    const onTabChange = (e: { value: MenuItem; index: number }) => {
        if (e.value && e.value.id) {
            setActiveTab(e.value.id);
            router.push(e.value.id);
        }
    };

    const closeTab = (e: React.MouseEvent, tabId: string) => {
        e.stopPropagation();
        drop(tabId);
        removeTab(tabId);
    };

    const scrollTabs = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 300;
            const targetScroll = scrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
            scrollRef.current.scrollTo({
                left: targetScroll,
                behavior: 'smooth'
            });
        }
    };

    const handleDragStart = (index: number) => {
        setDraggedTabIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (index: number) => {
        if (draggedTabIndex !== null && draggedTabIndex !== index) {
            reorderTabs(draggedTabIndex, index);
        }
        setDraggedTabIndex(null);
    };

    const closeAllTabs = () => {
        tabs.forEach((tab) => drop(tab.id));
        clearTabs();
        addTab(initialTab);
    };

    const menuItems: MenuItem[] = tabs.map((tab, index) => ({
        id: tab.id,
        label: tab.label,
        tabIndex: index,
        template: (item, options) => (
            <div
                className={options.className}
                onClick={options.onClick}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={() => setDraggedTabIndex(null)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    minWidth: 'max-content',
                    height: '100%',
                    opacity: draggedTabIndex === index ? 0.5 : 1,
                    transition: 'opacity 0.2s'
                }}
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
            {tabs.length > 0 && (
                <div
                    className="flex align-items-center"
                    style={{
                        width: '100%',
                        borderBottom: '1px solid var(--surface-border)',
                        backgroundColor: 'var(--surface-card)',
                        position: 'relative'
                    }}
                >
                    <Button
                        icon="pi pi-chevron-left"
                        onClick={() => scrollTabs('left')}
                        className="p-button-text p-button-secondary no-shrink"
                        style={{ height: '45px', width: '40px', borderRadius: 0, padding: 0, zIndex: 2 }}
                    />
                    <div
                        className="tab-menu-container"
                        ref={scrollRef}
                        style={{
                            flex: 1,
                            overflowX: 'auto',
                            overflowY: 'hidden',
                            WebkitOverflowScrolling: 'touch'
                        }}
                    >
                        <TabMenu model={menuItems} activeIndex={activeIndex} onTabChange={onTabChange} />
                        <style>{`
                            .tab-menu-container::-webkit-scrollbar {
                                height: 4px;
                            }
                            .tab-menu-container::-webkit-scrollbar-track {
                                background: var(--surface-ground);
                            }
                            .tab-menu-container::-webkit-scrollbar-thumb {
                                background: var(--surface-400);
                                border-radius: 10px;
                            }
                            /* PrimeReact 내부 스타일 강제 오버라이드 */
                            .tab-menu-container .p-tabmenu {
                                overflow: visible !important;
                            }
                            .tab-menu-container .p-tabmenu-nav {
                                display: flex !important;
                                flex-wrap: nowrap !important;
                                width: max-content !important;
                                min-width: 100% !important;
                                border-bottom: none !important;
                                background: transparent !important;
                            }
                            .tab-menu-container .p-tabmenuitem {
                                flex-shrink: 0 !important;
                            }
                            .no-shrink {
                                flex-shrink: 0 !important;
                            }
                        `}</style>
                    </div>
                    <Button
                        icon="pi pi-chevron-right"
                        onClick={() => scrollTabs('right')}
                        className="p-button-text p-button-secondary no-shrink"
                        style={{ height: '45px', width: '40px', borderRadius: 0, padding: 0, zIndex: 2 }}
                    />
                    <Button
                        icon="pi pi-trash"
                        onClick={closeAllTabs}
                        title="모든 탭 닫기"
                        className="p-button-text p-button-danger no-shrink"
                        style={{ height: '45px', width: '40px', borderRadius: 0, padding: 0, zIndex: 2 }}
                    />
                </div>
            )}
            <div className="p-0 md:p-4">
                {tabs.map((tab) => {
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
