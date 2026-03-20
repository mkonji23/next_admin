'use client';

import React, { useContext, useMemo, useState, useEffect } from 'react';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import AppMenuitem from './AppMenuitem';
import { AppMenuModel } from '@/constants/menu';
import useAuthStore from '@/store/useAuthStore';

const AppMenu = () => {
    const { userInfo } = useAuthStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const model = useMemo(() => {
        console.log('userInfo', userInfo);
        // 서버 렌더링 시점이나 클라이언트의 첫 번째 렌더링(하이드레이션) 시점에는
        // 전체 메뉴(AppMenuModel)를 반환하여 서버 HTML과 일치시킵니다.
        if (!mounted || userInfo.auth === 'admin' || userInfo.menuPermissions === undefined) {
            return AppMenuModel;
        }

        // 브라우저에 마운트된 이후에만 실제 권한에 따른 필터링을 수행합니다.
        return AppMenuModel.map((group) => {
            if (!group.items) return group;

            const visibleItems = group.items.filter((item) => {
                // to가 없거나 menuPermissions에 포함된 경우만 표시
                return !item.to || userInfo.menuPermissions?.includes(item.to);
            });

            return {
                ...group,
                items: visibleItems
            };
        }).filter((group) => group.items && group.items.length > 0);
    }, [userInfo.auth, userInfo.menuPermissions, mounted]);

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {model.map((item, i) => {
                    return !item?.seperator ? (
                        <AppMenuitem item={item} root={true} index={i} key={item.label} />
                    ) : (
                        <li key={`separator-${i}`} className="menu-separator"></li>
                    );
                })}
            </ul>
        </MenuProvider>
    );
};

export default AppMenu;
