/* eslint-disable @next/next/no-img-element */

import React, { useContext } from 'react';
import AppMenuitem from './AppMenuitem';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import Link from 'next/link';
import { AppMenuItem } from '@/types';

const AppMenu = () => {
    const { layoutConfig } = useContext(LayoutContext);

    const model: AppMenuItem[] = [
        {
            label: 'Home',
            items: [
                { label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' },
                { label: '파일리스트', icon: 'pi pi-fw pi-circle-fill', to: '/fileList' },
                { label: '칭찬현황', icon: 'pi pi-fw pi-heart', to: '/praise' },
                { label: '출석부', icon: 'pi pi-fw pi-check-square', to: '/attendance' },
                { label: '사용자 목록', icon: 'pi pi-fw pi-users', to: '/userList' },
                { label: '학생 목록', icon: 'pi pi-fw pi-user', to: '/studentList' },
                { label: '클래스 목록', icon: 'pi pi-fw pi-book', to: '/classList' },
            ]
        },
        {
            label: 'HELP',
            items: [
                { label: '사용 매뉴얼', icon: 'pi pi-fw pi-book', to: '/manual' }
            ]
        }
    ];

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
