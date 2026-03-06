'use client';
import Link from 'next/link';
import { Ripple } from 'primereact/ripple';
import { classNames } from 'primereact/utils';
import React, { useEffect, useContext } from 'react';
import { CSSTransition } from 'react-transition-group';
import { MenuContext } from './context/menucontext';
import { AppMenuItemProps } from '@/types';
import { usePathname, useSearchParams, useRouter } from 'next/navigation'; // useRouter 추가
import { useTabStore } from '@/store/useTabStore';

const AppMenuitem = (props: AppMenuItemProps) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { activeMenu, setActiveMenu } = useContext(MenuContext);
    const { addTab, activeTab, setActiveTab: setStoreActiveTab } = useTabStore();
    const item = props.item;
    const key = props.parentKey ? props.parentKey + '-' + props.index : String(props.index);
    const router = useRouter(); // useRouter 초기화

    // 메뉴 아이템의 활성 상태는 이제 activeTab과 비교합니다.
    const isMenuItemActive = item!.to && activeTab === item!.to;

    // 서브메뉴 확장을 위한 active 상태는 MenuContext를 계속 사용합니다.
    const active = activeMenu === key || activeMenu.startsWith(key + '-');

    const itemClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        // 기본 네비게이션 동작 방지
        if (item!.to) {
            event.preventDefault();
        }

        //avoid processing disabled items
        if (item!.disabled) {
            return;
        }

        //execute command
        if (item!.command) {
            item!.command({ originalEvent: event, item: item });
        }

        // 탭 추가 로직
        if (item?.to) {
            addTab({
                id: item.to,
                label: item.label,
                path: item.to
            });
            // 탭 클릭 시 해당 탭을 활성화
            setStoreActiveTab(item.to);
            router.replace(item.to); // 메뉴 클릭 시 URL 업데이트
        }

        // 서브메뉴 확장을 위한 active 상태 설정
        if (item!.items) {
            setActiveMenu(active ? (props.parentKey as string) : key);
        } else {
            setActiveMenu(key); // 자식 없는 아이템 클릭 시에도 메뉴 활성화
        }
    };

    const subMenu = item!.items && item!.visible !== false && (
        <CSSTransition
            timeout={{ enter: 1000, exit: 450 }}
            classNames="layout-submenu"
            in={props.root ? true : active}
            key={item!.label}
        >
            <ul>
                {item!.items.map((child, i) => {
                    return (
                        <AppMenuitem
                            item={child}
                            index={i}
                            className={child.badgeClass}
                            parentKey={key}
                            key={child.label}
                        />
                    );
                })}
            </ul>
        </CSSTransition>
    );

    return (
        <li className={classNames({ 'layout-root-menuitem': props.root, 'active-menuitem': active })}>
            {props.root && item!.visible !== false && <div className="layout-menuitem-root-text">{item!.label}</div>}
            {(!item!.to || item!.items) && item!.visible !== false ? (
                <a
                    href={item!.url}
                    onClick={(e) => itemClick(e)}
                    className={classNames(item!.class, 'p-ripple')}
                    target={item!.target}
                    tabIndex={0}
                >
                    <i className={classNames('layout-menuitem-icon', item!.icon)}></i>
                    <span className="layout-menuitem-text">{item!.label}</span>
                    {item!.items && <i className="pi pi-fw pi-angle-down layout-submenu-toggler"></i>}
                    <Ripple />
                </a>
            ) : null}

            {item!.to && !item!.items && item!.visible !== false ? (
                <a
                    href={item!.to}
                    onClick={(e) => itemClick(e)}
                    className={classNames(item!.class, 'p-ripple', { 'active-route': isMenuItemActive })}
                    tabIndex={0}
                    target={item!.target}
                >
                    <i className={classNames('layout-menuitem-icon', item!.icon)}></i>
                    <span className="layout-menuitem-text">{item!.label}</span>
                    {item!.items && <i className="pi pi-fw pi-angle-down layout-submenu-toggler"></i>}
                    <Ripple />
                </a>
            ) : null}

            {subMenu}
        </li>
    );
};

export default AppMenuitem;
