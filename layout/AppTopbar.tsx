/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { classNames } from 'primereact/utils';
import React, { forwardRef, useContext, useImperativeHandle, useRef } from 'react';
import { AppTopbarRef } from '@/types';
import { LayoutContext } from './context/layoutcontext';
import useAuth from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';
import { getCommonLabel } from '@/util/common';
import { USER_AUTH_OPTIONS } from '@/constants/user';

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { layoutConfig, layoutState, onMenuToggle, showProfileSidebar } = useContext(LayoutContext);
    const menubuttonRef = useRef(null);
    const topbarmenuRef = useRef(null);
    const topbarmenubuttonRef = useRef(null);
    const { logout } = useAuth();
    const router = useRouter();
    const { userInfo } = useAuthStore();

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current,
        topbarmenu: topbarmenuRef.current,
        topbarmenubutton: topbarmenubuttonRef.current
    }));

    const handleLogout = () => {
        logout();
        router.push('/auth/login');
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

            <div
                ref={topbarmenuRef}
                className={classNames('layout-topbar-menu', {
                    'layout-topbar-menu-mobile-active': layoutState.profileSidebarVisible
                })}
            >
                <button type="button" className="p-link layout-topbar-button">
                    <i className="pi pi-user"></i>
                    <span>Profile</span>
                </button>
                <Link href="/documentation">
                    <button type="button" className="p-link layout-topbar-button">
                        <i className="pi pi-cog"></i>
                        <span>Settings</span>
                    </button>
                </Link>
                <button type="button" className="p-link layout-topbar-button" onClick={handleLogout}>
                    <i className="pi pi-sign-out"></i>
                    <span>Quit</span>
                </button>
            </div>
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;
