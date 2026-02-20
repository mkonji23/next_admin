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
import ChatPanel from '@/components/chat/ChatPanel';
import { Badge } from 'primereact/badge';
import { Button } from 'primereact/button';

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { layoutConfig, layoutState, onMenuToggle, showProfileSidebar } = useContext(LayoutContext);
    const menubuttonRef = useRef(null);
    const topbarmenuRef = useRef(null);
    const topbarmenubuttonRef = useRef(null);
    const chatButtonRef = useRef<HTMLButtonElement>(null);
    const { logout } = useAuth();
    const router = useRouter();
    const { userInfo, initializeFromStorage } = useAuthStore();
    const [chatVisible, setChatVisible] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        // 컴포넌트 마운트 시 localStorage에서 userInfo 복원
        initializeFromStorage();
        setMounted(true);
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

    const handleChatToggle = () => {
        setChatVisible(!chatVisible);
        if (!chatVisible) {
            setUnreadCount(0); // 채팅 열면 읽음 처리
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
                    {userInfo?.userName && (
                        <span className="user-name">{userInfo.userName}</span>
                    )}
                    {userInfo?.userId && (
                        <span className="user-id">({userInfo.userId})</span>
                    )}
                    {userInfo?.auth && (
                        <span className="user-auth">
                            {getCommonLabel(USER_AUTH_OPTIONS, userInfo.auth)}
                        </span>
                    )}
                </div>
            )}

            {/* <button
                ref={chatButtonRef}
                type="button"
                className="p-link layout-topbar-button layout-topbar-chat-button"
                onClick={handleChatToggle}
            >
                <i className="pi pi-comments p-overlay-badge">
                    {unreadCount > 0 && (
                        <Badge value={unreadCount > 99 ? '99+' : unreadCount.toString()} severity="danger" />
                    )}
                </i>
            </button> */}


            <ChatPanel
                visible={chatVisible}
                onHide={() => setChatVisible(false)}
                target={chatButtonRef.current}
            />

            <div
                ref={topbarmenuRef}
                className={classNames('layout-topbar-menu', {
                    'layout-topbar-menu-mobile-active': layoutState.profileSidebarVisible
                })}
            >
                <Button
                    className="p-link layout-topbar-button"
                    tooltip="프로필"
                    tooltipOptions={{ position: 'bottom' }}
                    onClick={() => router.push('/profile')}
                >
                    <i className="pi pi-user"></i>
                    <span>Profile</span>
                </Button>
                <Button
                    className="p-link layout-topbar-button"
                    tooltip="설정"
                    tooltipOptions={{ position: 'bottom' }}
                    onClick={() => router.push('/documentation')}
                >
                    <i className="pi pi-cog"></i>
                    <span>Settings</span>
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
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;
