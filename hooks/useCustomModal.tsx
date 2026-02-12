'use client';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import UserModal from '@/components/modals/UserModal';
import type {
    ModalConfig,
    ModalProviderProps,
    OpenModalParams,
    ModalState,
    ModalContextType
} from '@/types/modal';

export type { ModalConfig } from '@/types/modal';

const ModalContext = createContext<ModalContextType | null>(null);

export const useCustomModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useCustomModal must be used within ModalProvider');
    }
    return context;
};


export const ModalProvider = ({ children }: ModalProviderProps) => {
    const [modals, setModals] = useState<Map<string, React.ComponentType<any>>>(new Map());
    const [modalStates, setModalStates] = useState<Map<string, ModalState>>(new Map());

    const registerModal = useCallback((config: ModalConfig) => {
        setModals((prev) => {
            const newMap = new Map(prev);
            newMap.set(config.id, config.component);
            return newMap;
        });
    }, []);

    // 모달 컴포넌트들을 등록
    useEffect(() => {
        registerModal({ id: 'user', component: UserModal });
        
        // 여기에 다른 모달들을 추가할 수 있습니다
        // registerModal({ id: 'other', component: OtherModal });
    }, [registerModal]);

    const openModal = useCallback(<T = any, R = any>(params: OpenModalParams<T>): Promise<R> => {
        return new Promise((resolve, reject) => {
            if (!modals.has(params.id)) {
                reject(new Error(`Modal with id "${params.id}" is not registered`));
                return;
            }

            setModalStates((prev) => {
                const newMap = new Map(prev);
                newMap.set(params.id, {
                    id: params.id,
                    visible: true,
                    pData: params.pData,
                    resolve,
                    reject
                });
                return newMap;
            });
        });
    }, [modals]);

    const closeModal = useCallback((id: string, result?: any) => {
        setModalStates((prev) => {
            const newMap = new Map(prev);
            const state = newMap.get(id);
            if (state && state.resolve) {
                // result가 undefined면 null로 처리 (취소)
                state.resolve(result !== undefined ? result : null);
                newMap.delete(id);
            }
            return newMap;
        });
    }, []);

    const value: ModalContextType = {
        openModal,
        closeModal,
        registerModal,
        modals
    };

    return (
        <ModalContext.Provider value={value}>
            {children}
            {Array.from(modalStates.entries()).map(([id, state]) => {
                const ModalComponent = modals.get(id);
                if (!ModalComponent) return null;

                return (
                    <ModalComponent
                        key={id}
                        visible={state.visible}
                        pData={state.pData}
                        onClose={(result?: any) => closeModal(id, result)}
                    />
                );
            })}
        </ModalContext.Provider>
    );
};   
       
