import React, { useContext } from 'react';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import AppMenuitem from './AppMenuitem';
import { AppMenuModel } from '@/constants/menu'; // AppMenuModel 임포트

const AppMenu = () => {
    const { layoutConfig } = useContext(LayoutContext);

    const model = AppMenuModel; // 상수 사용

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {model.map((item, i) => {
                    return !item?.seperator ? (
                        <AppMenuitem item={item} root={true} index={i} key={item.label} />
                    ) : (
                        <li className="menu-separator"></li>
                    );
                })}
            </ul>
        </MenuProvider>
    );
};

export default AppMenu;
