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
import { useNotificationStore } from '@/store/useNotificationStore';
import { useHttp } from '@/util/axiosInstance';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';

dayjs.extend(relativeTime);
dayjs.locale('ko');

const getNotificationIcon = (type: string): string => {
    switch (type) {
        case 'SHARE_CREATED':
            return 'pi pi-share-alt';
        case 'NEW_MESSAGE':
            return 'pi pi-envelope';
        case 'TEST_RESULT':
            return 'pi pi-chart-bar';
        default:
            return 'pi pi-info-circle';
    }
};

const formatNotificationTime = (date: string): string => {
    const now = dayjs();
    const notificationTime = dayjs(date);
    const diffMinutes = now.diff(notificationTime, 'minute');
    const diffHours = now.diff(notificationTime, 'hour');

    if (diffMinutes < 5) {
        return '방금 전';
    }
    if (diffMinutes < 60) {
        return `${diffMinutes}분 전`;
    }
    if (diffHours < 3) {
        return `${diffHours}시간 전`;
    }
    return notificationTime.format('YYYY-MM-DD HH:mm');
};

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
    const { notifications, setNotifications } = useNotificationStore();
    const notificationPanelRef = useRef<OverlayPanel>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const http = useHttp();

    useEffect(() => {
        initializeFromStorage();
        setMounted(true);

        const fetchNotifications = async () => {
            if (!userInfo.userId) return;
            try {
                const response = await http.get(`/choiMath/notifications/${userInfo?.userId}`, {
                    disableLoading: true
                });
                setNotifications(response.data);
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            }
        };

        fetchNotifications();
    }, [initializeFromStorage]);

    useEffect(() => {
        if (notifications) {
            setUnreadCount(notifications.filter((n) => !n.isRead).length);
        }
    }, [notifications]);

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

    const markAllAsRead = async () => {
        const unreadNotifications = notifications.filter((n) => !n.isRead);
        if (unreadNotifications.length === 0) return;

        try {
            await http.post(
                `/choiMath/notifications/read`,
                { notificationIds: notifications.map((item) => item._id) },
                { disableLoading: true }
            );
            // 로컬 상태 업데이트
            const updatedNotifications = notifications.map((n) => ({ ...n, isRead: true }));
            setNotifications(updatedNotifications);
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
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
                {layoutState.profileSidebarVisible === true ? (
                    <Button
                        className="p-link layout-topbar-button"
                        tooltip="알림"
                        tooltipOptions={{ position: 'bottom' }}
                        onClick={handleNotificationClick}
                    >
                        <i className="pi pi-bell p-overlay-badge">
                            {unreadCount > 0 && <Badge value={unreadCount} severity="danger" />}
                        </i>
                        <span>알림</span>
                    </Button>
                ) : (
                    <button className="p-link" onClick={handleNotificationClick}>
                        <i
                            className="pi pi-bell ml-4 mt-1 mr-1 p-text-secondary p-overlay-badge"
                            style={{ fontSize: '1.5rem' }}
                        >
                            {unreadCount > 0 && <Badge value={unreadCount} severity="danger" />}
                        </i>
                    </button>
                )}

                <Button
                    className="p-link layout-topbar-button"
                    tooltip="프로필"
                    tooltipOptions={{ position: 'bottom' }}
                    onClick={goToProfile}
                >
                    <i className="pi pi-user"></i>
                    <span>프로필</span>
                </Button>
                <Button
                    className="p-link layout-topbar-button"
                    onClick={handleLogout}
                    tooltip="로그아웃"
                    tooltipOptions={{ position: 'bottom' }}
                >
                    <i className="pi pi-sign-out"></i>
                    <span>로그아웃</span>
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
                        {notifications?.filter((item) => !item.isRead).length > 0 ? (
                            notifications
                                ?.filter((item) => !item.isRead)
                                ?.map((notification) => (
                                    <li
                                        key={notification?._id}
                                        className={`flex align-items-start p-2 border-round ${
                                            !notification.isRead ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <i
                                            className={`${getNotificationIcon(
                                                notification?.detail?.type
                                            )} text-2xl mr-3`}
                                        ></i>
                                        <div className="flex-1">
                                            <p className="m-0 text-sm">{notification?.detail?.content}</p>
                                            <span className="text-xs text-color-secondary">
                                                {formatNotificationTime(notification?.detail?.createdAt)}
                                            </span>
                                        </div>
                                    </li>
                                ))
                        ) : (
                            <div className="flex align-items-center justify-content-center p-3 text-color-secondary">
                                알림이 없습니다.
                            </div>
                        )}
                    </ul>
                </div>
            </OverlayPanel>
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;
