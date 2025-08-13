import { Toast, ToastMessage } from 'primereact/toast';
import { createContext, ReactNode, useContext, useRef } from 'react';
import { createPortal } from 'react-dom';

// 타입
export type ToastContextType = {
    showToast: (toastProp: ToastParam) => void;
};

type ToastParam = Pick<ToastMessage, 'severity' | 'summary' | 'detail'>;

const ToastContext = createContext<ToastContextType | null>(null);
export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const toastRef = useRef<Toast>(null);

    const showToast = (props: ToastParam) => {
        toastRef.current?.show({
            severity: props.severity || 'info',
            summary: props.summary || 'Confirmed',
            detail: props.detail || 'No Content',
            life: 3000
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
