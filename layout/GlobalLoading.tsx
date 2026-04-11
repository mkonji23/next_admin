"use client";

import { ProgressBar } from 'primereact/progressbar';
import { useLoading } from './context/loadingcontext';
import { Portal } from 'primereact/portal';

export const GlobalLoading = () => {
    const { loading } = useLoading();

    if (!loading) return null;

    return (
        <Portal>
            <div className="global-loading-overlay">
                <ProgressBar mode="indeterminate" style={{ height: '6px', width: '100%' }} />
            </div>
        </Portal>
    );
};
