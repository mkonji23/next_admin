'use client';

import { Toast, ToastMessage } from 'primereact/toast';
import { createContext, ReactNode, useContext, useRef } from 'react';
import { createPortal } from 'react-dom';

// 타입
export type ToastContextType = {
    showToast: (toastProp: ToastParam) => void;
};

type ToastParam = Pick<ToastMessage, 'severity' | 'summary' | 'detail' | 'life'>;

const ToastContext = createContext<ToastContextType | null>(null);
export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const toastRef = useRef<Toast>(null);

    const showToast = (props: ToastParam) => {
        const sanitize = (val: any): string => {
            if (val === null || val === undefined) return '';
            if (typeof val === 'object') {
                return val.message || val.code || val.error || JSON.stringify(val);
            }
            return String(val);
        };

        toastRef.current?.show({
            severity: props.severity || 'info',
            summary: sanitize(props.summary) || 'Confirmed',
            detail: sanitize(props.detail),
            life: props.life || 3000,
            className: 'custom-toast' // 클래스 지정
        });
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            <Toast ref={toastRef} /> {/* Portal 대신 그냥 여기서 렌더 */}
            {children}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast 에러!');
    return context;
};
