'use client';
import React, { useState, createContext, useEffect, useContext } from 'react';
import { PrimeReactContext } from 'primereact/api';

import { LayoutState, ChildContainerProps, LayoutConfig, LayoutContextProps } from '@/types';
export const LayoutContext = createContext({} as LayoutContextProps);

export const LayoutProvider = ({ children }: ChildContainerProps) => {
    const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({
        ripple: false,
        inputStyle: 'outlined',
        menuMode: 'static',
        colorScheme: 'light',
        theme: 'lara-light-indigo',
        scale: 14
    });

    const { changeTheme } = useContext(PrimeReactContext);

    useEffect(() => {
        const storedConfig = localStorage.getItem('layoutConfig');
        if (storedConfig) {
            try {
                const config = JSON.parse(storedConfig);
                if (config.theme !== layoutConfig.theme) {
                    changeTheme?.(layoutConfig.theme, config.theme, 'theme-css', () => {
                        setLayoutConfig(config);
                    });
                } else {
                    setLayoutConfig(config);
                }
            } catch (error) {
                console.error('Failed to parse layoutConfig from localStorage', error);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('layoutConfig', JSON.stringify(layoutConfig));
        
        // Add theme class to document element for SCSS targeting
        const root = document.documentElement;
        root.classList.remove('layout-theme-light', 'layout-theme-dark');
        root.classList.add(`layout-theme-${layoutConfig.colorScheme}`);
    }, [layoutConfig]);

    const [layoutState, setLayoutState] = useState<LayoutState>({
        staticMenuDesktopInactive: false,
        overlayMenuActive: false,
        profileSidebarVisible: false,
        configSidebarVisible: false,
        staticMenuMobileActive: false,
        menuHoverActive: false
    });

    const [isDesktop, setIsDesktop] = useState(true);

    useEffect(() => {
        const checkDesktop = () => {
            setIsDesktop(window.innerWidth > 991);
        };
        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    const onMenuToggle = () => {
        if (isOverlay()) {
            setLayoutState((prevLayoutState) => ({ ...prevLayoutState, overlayMenuActive: !prevLayoutState.overlayMenuActive }));
        }

        if (isDesktop) {
            setLayoutState((prevLayoutState) => ({ ...prevLayoutState, staticMenuDesktopInactive: !prevLayoutState.staticMenuDesktopInactive }));
        } else {
            setLayoutState((prevLayoutState) => ({ ...prevLayoutState, staticMenuMobileActive: !prevLayoutState.staticMenuMobileActive }));
        }
    };

    const showProfileSidebar = () => {
        setLayoutState((prevLayoutState) => ({ ...prevLayoutState, profileSidebarVisible: !prevLayoutState.profileSidebarVisible }));
    };

    const isOverlay = () => {
        return layoutConfig.menuMode === 'overlay';
    };

    const value: LayoutContextProps = {
        layoutConfig,
        setLayoutConfig,
        layoutState,
        setLayoutState,
        onMenuToggle,
        showProfileSidebar
    };

    return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
};
