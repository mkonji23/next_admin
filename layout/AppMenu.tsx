'use client';

import React, { useContext, useMemo } from 'react';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import AppMenuitem from './AppMenuitem';
import { AppMenuModel } from '@/constants/menu';
import useAuthStore from '@/store/useAuthStore';

const AppMenu = () => {
    const { layoutConfig } = useContext(LayoutContext);
    const { userInfo } = useAuthStore();

    const model = useMemo(() => {
        // 관리자는 모든 메뉴를 봅니다.
        if (userInfo.auth === 'admin') return AppMenuModel;
        // 권한 정보가 아예 없는 경우(레거시 사용자 등) 모든 메뉴를 표시합니다.
        // 빈 배열([])인 경우는 접근 권한이 하나도 없는 것으로 간주하여 필터링합니다.
        if (userInfo.menuPermissions === undefined) return AppMenuModel;

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
    }, [userInfo.auth, userInfo.menuPermissions]);

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
