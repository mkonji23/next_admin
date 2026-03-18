/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { classNames } from 'primereact/utils';
import React, { forwardRef, useContext, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { AppTopbarRef } from '@/types';
import { LayoutContext } from './context/layoutcontext';
import useAuth from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';
import { getCommonLabel } from '@/util/common';
import { USER_AUTH_OPTIONS } from '@/constants/user';
import { Badge } from 'primereact/badge';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import { useTabStore } from '@/store/useTabStore';

interface Notification {
    id: number;
    text: string;
    time: string;
    icon: string;
    read: boolean;
}

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { layoutConfig, layoutState, onMenuToggle, showProfileSidebar } = useContext(LayoutContext);
    const menubuttonRef = useRef(null);
    const topbarmenuRef = useRef(null);
    const topbarmenubuttonRef = useRef(null);
    const { logout } = useAuth();
    const router = useRouter();
    const { userInfo, initializeFromStorage } = useAuthStore();
    const [mounted, setMounted] = useState(false);
    const { addTab, setActiveTab } = useTabStore();

    // 알림 관련 상태 및 참조
    const notificationPanelRef = useRef<OverlayPanel>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        // 컴포넌트 마운트 시 userInfo 복원 및 임시 알림 데이터 설정
        initializeFromStorage();
        setMounted(true);

        // 임시 알림 데이터
        const mockNotifications: Notification[] = [
            { id: 1, text: '새로운 공지가 등록되었습니다.', time: '5분 전', icon: 'pi pi-info-circle', read: false },
            {
                id: 2,
                text: '숙제 제출 마감일이 임박했습니다.',
                time: '30분 전',
                icon: 'pi pi-exclamation-triangle',
                read: false
            },
            {
                id: 3,
                text: '다음 주 수업 일정이 변경되었습니다.',
                time: '1시간 전',
                icon: 'pi pi-calendar',
                read: false
            },
            { id: 4, text: '시스템 점검이 예정되어 있습니다.', time: '3시간 전', icon: 'pi pi-cog', read: true }
        ];
        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter((n) => !n.read).length);

        // // 5초마다 새로운 알림을 시뮬레이션하는 리스너
        // const interval = setInterval(() => {
        //     const newNotification: Notification = {
        //         id: Date.now(),
        //         text: '새로운 테스트 결과가 도착했습니다.',
        //         time: '방금 전',
        //         icon: 'pi pi-check-square',
        //         read: false
        //     };
        //     setNotifications((prev) => [newNotification, ...prev]);
        //     setUnreadCount((prev) => prev + 1);
        // }, 5000);

        // 컴포넌트 언마운트 시 인터벌 정리
        // return () => clearInterval(interval);
    }, [initializeFromStorage]);

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current,
        topbarmenu: topbarmenuRef.current,
        topbarmenubutton: topbarmenubuttonRef.current
    }));

    const handleLogout = () => {
        logout();
        router.push('/auth/login');
    };

    const goToProfile = () => {
        const tab = { id: '/profile', label: '프로필', path: '/profile' };
        addTab(tab);
        setActiveTab(tab.id);
        router.push(tab.path);
    };

    const handleNotificationClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        notificationPanelRef.current?.toggle(event);
    };

    const markAllAsRead = () => {
        setUnreadCount(0);
        setNotifications(notifications.map((n) => ({ ...n, read: true })));
    };

    return (
        <div className="layout-topbar">
            <button
                ref={menubuttonRef}
                type="button"
                className="p-link layout-menu-button layout-topbar-button"
                onClick={onMenuToggle}
            >
                <i className="pi pi-bars" />
            </button>

            <Link href="/" className="layout-topbar-logo">
                <img
                    src={`/layout/images/logo-${layoutConfig.colorScheme !== 'light' ? 'white' : 'dark'}.svg`}
                    width="47.22px"
                    height={'35px'}
                    alt="logo"
                />
                <span>출석부</span>
            </Link>

            <button
                ref={topbarmenubuttonRef}
                type="button"
                className="p-link layout-topbar-menu-button layout-topbar-button"
                onClick={showProfileSidebar}
            >
                <i className="pi pi-ellipsis-v" />
            </button>

            {mounted && (
                <div className="layout-topbar-user-info">
                    {userInfo?.userName && <span className="user-name">{userInfo.userName}</span>}
                    {userInfo?.userId && <span className="user-id">({userInfo.userId})</span>}
                    {userInfo?.auth && (
                        <span className="user-auth">{getCommonLabel(USER_AUTH_OPTIONS, userInfo.auth)}</span>
                    )}
                </div>
            )}

            <div
                ref={topbarmenuRef}
                className={classNames('layout-topbar-menu', {
                    'layout-topbar-menu-mobile-active': layoutState.profileSidebarVisible
                })}
            >
                <button type="button" className="p-link layout-topbar-button" onClick={handleNotificationClick}>
                    <i className="pi pi-bell p-overlay-badge">
                        {unreadCount > 0 && <Badge value={unreadCount} severity="danger" />}
                    </i>
                    <span>알림</span>
                </button>
                <Button
                    className="p-link layout-topbar-button"
                    tooltip="프로필"
                    tooltipOptions={{ position: 'bottom' }}
                    onClick={goToProfile}
                >
                    <i className="pi pi-user"></i>
                    <span>Profile</span>
                </Button>
                <Button
                    className="p-link layout-topbar-button"
                    onClick={handleLogout}
                    tooltip="로그아웃"
                    tooltipOptions={{ position: 'bottom' }}
                >
                    <i className="pi pi-sign-out"></i>
                    <span>Quit</span>
                </Button>
            </div>

            <OverlayPanel
                ref={notificationPanelRef}
                appendTo={typeof window !== 'undefined' ? document.body : undefined}
                style={{ width: '350px' }}
            >
                <div className="flex flex-column gap-3">
                    <div className="flex justify-content-between align-items-center">
                        <span className="font-bold text-lg">알림</span>
                        <Button label="모두 읽음" className="p-button-text" onClick={markAllAsRead} />
                    </div>
                    <ul
                        className="list-none p-0 m-0 flex flex-column gap-3"
                        style={{ maxHeight: '400px', overflowY: 'auto' }}
                    >
                        {notifications.map((notification) => (
                            <li
                                key={notification.id}
                                className={`flex align-items-start p-2 border-round ${
                                    !notification.read ? 'bg-blue-50' : ''
                                }`}
                            >
                                <i className={`${notification.icon} text-2xl mr-3`}></i>
                                <div className="flex-1">
                                    <p className="m-0 text-sm">{notification.text}</p>
                                    <span className="text-xs text-color-secondary">{notification.time}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </OverlayPanel>
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;
