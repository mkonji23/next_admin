import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import React, { createContext, ReactNode, useContext } from 'react';

type ShowConfirmParams = {
    message: React.ReactNode;
    header: string;
    icon?: string;
    acceptLabel?: string;
    rejectLabel?: string;
};

type ConfirmContextType = {
    showConfirm: (params: ShowConfirmParams) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
    const showConfirm = (params: ShowConfirmParams): Promise<boolean> => {
        return new Promise((resolve) => {
            confirmDialog({
                message: params.message,
                header: params.header,
                icon: params.icon || 'pi pi-exclamation-triangle',
                acceptClassName: 'p-button-danger',
                acceptLabel: params.acceptLabel || '확인',
                rejectLabel: params.rejectLabel || '취소',
                accept: () => resolve(true),
                reject: () => resolve(false)
            });
        });
    };

    return (
        <ConfirmContext.Provider value={{ showConfirm }}>
            <ConfirmDialog />
            {children}
        </ConfirmContext.Provider>
    );
};

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
};
