import { ReactNode } from 'react';

export interface ModalConfig {
    id: string;
    component: React.ComponentType<any>;
}

export interface ModalProviderProps {
    children: ReactNode;
}

export interface OpenModalParams<T = any> {
    id: string;
    pData?: T;
}

export interface ModalState {
    id: string;
    visible: boolean;
    pData?: any;
    resolve?: (value: any) => void;
    reject?: (reason?: any) => void;
}

export interface ModalContextType {
    openModal: <T = any, R = any>(params: OpenModalParams<T>) => Promise<R>;
    closeModal: (id: string, result?: any) => void;
    registerModal: (config: ModalConfig) => void;
    modals: Map<string, React.ComponentType<any>>;
}
