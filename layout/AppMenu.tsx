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
            label: 'Statistics',
            items: [
                { label: '출석 현황 통계', icon: 'pi pi-fw pi-chart-bar', to: '/attendanceList', badge: 'NEW' },
                { label: '학생별 출석현황 통계', icon: 'pi pi-fw pi-user', to: '/studentAttendanceStatistics' }
            ]
        },
        {
            label: 'Attendance',
            items: [
                { label: '칭찬현황', icon: 'pi pi-fw pi-heart', to: '/praise' },
                { label: '출석부', icon: 'pi pi-fw pi-check-square', to: '/attendance' }
            ]
        },
        {
            label: 'Settings',
            items: [
                { label: '사용자 목록', icon: 'pi pi-fw pi-users', to: '/userList' },
                { label: '학생 목록', icon: 'pi pi-fw pi-user', to: '/studentList' },
                { label: '클래스 목록', icon: 'pi pi-fw pi-book', to: '/classList' },
                { label: '토큰 발급', icon: 'pi pi-fw pi-key', to: '/settings/kakao' }
            ]
        },

        {
            label: 'HELP',
            items: [
                { label: '사용 매뉴얼', icon: 'pi pi-fw pi-book', to: '/manual' },
                { label: 'example', icon: 'pi pi-fw pi-home', to: '/dash' }
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
