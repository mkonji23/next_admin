import React, { useContext } from 'react';
import { Button } from 'primereact/button';
import { LayoutContext } from './context/layoutcontext';
import { PrimeReactContext } from 'primereact/api';
import AppMenu from './AppMenu';

const AppSidebar = () => {
    const { layoutConfig, setLayoutConfig } = useContext(LayoutContext);
    const { changeTheme } = useContext(PrimeReactContext);

    const toggleTheme = () => {
        const isLight = layoutConfig.theme === 'lara-light-indigo';
        const newTheme = isLight ? 'lara-dark-indigo' : 'lara-light-indigo';
        const newColorScheme = isLight ? 'dark' : 'light';

        changeTheme?.(layoutConfig.theme, newTheme, 'theme-css', () => {
            setLayoutConfig((prevState) => ({ ...prevState, theme: newTheme, colorScheme: newColorScheme }));
        });
    };

    return (
        <div className="flex flex-column h-full">
            <div className="flex-1 overflow-y-auto">
                <AppMenu />
            </div>
            <div className="mt-auto pt-3 border-top-1 surface-border">
                <Button
                    icon={layoutConfig.colorScheme === 'light' ? 'pi pi-moon' : 'pi pi-sun'}
                    rounded
                    text
                    severity="secondary"
                    onClick={toggleTheme}
                    label={layoutConfig.colorScheme === 'light' ? '다크 모드' : '라이트 모드'}
                    className="w-full"
                />
            </div>
        </div>
    );
};

export default AppSidebar;
