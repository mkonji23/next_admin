'use client';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import UserModal from '@/components/modals/UserModal';
import ClassModal from '@/components/modals/ClassModal';
import StudentModal from '@/components/modals/StudentModal';
import TodoModal from '@/components/modals/TodoModal';
import TodoDetail from '@/app/(main)/assistantTodo/components/TodoDetail';
import ToDoDetailModal from '@/components/modals/ToDoDetailModal';
import { ModalConfig, ModalContextType, ModalProviderProps, ModalState, OpenModalParams } from '@/types/modal';
import StudentSelectModal from '@/components/modals/StudentSelectModal';
import ShareAutoTemplateModal from '@/components/modals/ShareAutoTemplateModal';
import DeleteTemplateModal from '@/components/modals/DeleteTemplateModal';
import EditAutoTemplateModal from '@/components/modals/EditAutoTemplateModal';
import KakaoTemplateModal from '@/components/modals/KakaoTemplateModal';
import AutoImageUploadModal from '@/components/modals/AutoImageUploadModal';

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
        registerModal({ id: 'class', component: ClassModal });
        registerModal({ id: 'student', component: StudentModal });
        registerModal({ id: 'studentSelect', component: StudentSelectModal });
        registerModal({ id: 'todo', component: TodoModal });
        registerModal({ id: 'todoDetailModal', component: ToDoDetailModal });
        registerModal({ id: 'shareTemplate', component: ShareAutoTemplateModal });
        registerModal({ id: 'deleteTemplate', component: DeleteTemplateModal });
        registerModal({ id: 'editAutoTemplate', component: EditAutoTemplateModal });
        registerModal({ id: 'KakaoTemplateModal', component: KakaoTemplateModal });
        registerModal({ id: 'autoImageUpload', component: AutoImageUploadModal });

        // 여기에 다른 모달들을 추가할 수 있습니다
    }, [registerModal]);

    const openModal = useCallback(
        <T = any, R = any>(params: OpenModalParams<T>): Promise<R> => {
            return new Promise((resolve, reject) => {
                if (!modals.has(params.id)) {
                    reject(new Error(`Modal with id "${params.id}" is not registered`));
                    return;
                }

                // 히스토리 상태 추가
                window.history.pushState({ modalId: params.id }, '');

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
        },
        [modals]
    );

    const closeModal = useCallback((id: string, result?: any, fromPopState = false) => {
        setModalStates((prev) => {
            const newMap = new Map(prev);
            const state = newMap.get(id);
            if (state && state.resolve) {
                // UI(버튼 등)를 통해 직접 닫는 경우에만 히스토리 백
                if (!fromPopState) {
                    window.history.back();
                }
                // result가 undefined면 null로 처리 (취소)
                state.resolve(result !== undefined ? result : null);
                newMap.delete(id);
            }
            return newMap;
        });
    }, []);

    // 뒤로가기 이벤트 감지
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            setModalStates((prev) => {
                if (prev.size === 0) return prev;

                const entries = Array.from(prev.entries());
                const [lastId, state] = entries[entries.length - 1];

                // 현재 활성화된 모달(lastId) 상태로 되돌아온 경우 무시
                // 예: Lightbox 등 내부 요소가 닫히면서 뒤로가기가 발생(popstate)하여 현재 모달 상태로 돌아온 경우
                if (event.state && event.state.modalId === lastId) {
                    return prev;
                }

                if (state && state.resolve) {
                    state.resolve(null); // 뒤로가기 시 null 반환
                    const newMap = new Map(prev);
                    newMap.delete(lastId);
                    return newMap;
                }
                return prev;
            });
        };

        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
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
