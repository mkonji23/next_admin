'use client';

import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import dayjs from 'dayjs';
import { Todo, TodoUser, TodoStatus } from '@/types/todo';
import { getUserTagColor } from '@/util/userTagColors';
import { CustomEditor } from '../editor/CustomEditor';
import { useCustomModal } from '@/hooks/useCustomModal';
import { STATUS_LABELS, CATEGORY_LABELS, STATUS_SEVERITIES } from '@/constants/todo';

interface ToDoDetailModalProps {
    visible: boolean;
    onClose: (result?: any) => void;
    pData?: {
        todo: Todo;
        onStatusChange: (todo: Todo, status: TodoStatus) => void;
    };
}

const ToDoDetailModal: React.FC<ToDoDetailModalProps> = ({ visible, onClose, pData }) => {
    const { openModal } = useCustomModal();
    const todo = pData?.todo;
    const onStatusChange = pData?.onStatusChange;

    const showTodoModal = async () => {
        const result = await openModal<any, Todo | null>({
            id: 'todo',
            pData: { mode: 'edit', todo }
        });
        if (result) {
            onClose(true);
        }
    };

    if (!todo) return null;

    const renderStatusButtons = () => {
        if (!todo) return null;

        return (
            <>
                {todo.status === 'PENDING' && (
                    <Button
                        label="진행 시작"
                        icon="pi pi-play"
                        className="p-button-info"
                        onClick={() => {
                            onStatusChange?.(todo, 'IN_PROGRESS');
                            onClose();
                        }}
                        style={{ marginRight: 'auto' }}
                    />
                )}
                {todo.status === 'IN_PROGRESS' && (
                    <>
                        <Button
                            label="완료 처리"
                            icon="pi pi-check-circle"
                            className="p-button-success"
                            onClick={() => {
                                onStatusChange?.(todo, 'COMPLETED');
                                onClose();
                            }}
                            style={{ marginRight: 'auto' }}
                        />
                        <Button
                            label="보류/지연"
                            icon="pi pi-pause"
                            className="p-button-danger"
                            onClick={() => {
                                onStatusChange?.(todo, 'HOLD');
                                onClose();
                            }}
                            style={{ marginRight: 'auto' }}
                        />
                    </>
                )}
                {todo.status === 'HOLD' && (
                    <Button
                        label="완료 처리"
                        icon="pi pi-check-circle"
                        className="p-button-success"
                        onClick={() => {
                            onStatusChange?.(todo, 'COMPLETED');
                            onClose();
                        }}
                        style={{ marginRight: 'auto' }}
                    />
                )}
                {todo.status === 'COMPLETED' && (
                    <Button
                        label="다시 진행"
                        icon="pi pi-refresh"
                        className="p-button-info"
                        onClick={() => {
                            onStatusChange?.(todo, 'IN_PROGRESS');
                            onClose();
                        }}
                        style={{ marginRight: 'auto' }}
                    />
                )}
            </>
        );
    };

    const footer = (
        <div className="flex justify-content-end gap-2">
            {renderStatusButtons()}
            <Button label="수정" icon="pi pi-pencil" onClick={() => showTodoModal()} className="p-button-warning" />
            <Button label="닫기" icon="pi pi-times" className="p-button-text" onClick={() => onClose()} />
        </div>
    );

    return (
        <Dialog
            header="업무 상세 조회"
            visible={visible}
            className="w-full md:w-9"
            contentStyle={{ minHeight: '65vh' }}
            footer={footer}
            onHide={() => onClose()}
            breakpoints={{ '960px': '75vw', '641px': '90vw' }}
            maximizable
            modal
            blockScroll
        >
            <div className="p-3 surface-ground border-round">
                <div className="grid">
                    <div className="col-12 mb-3">
                        <label className="block text-900 font-bold mb-1">업무 제목</label>
                        <div className="text-xl font-bold text-primary">{todo.title}</div>
                    </div>

                    <div className="col-12 md:col-3 mb-3">
                        <label className="block text-900 font-bold mb-1">업무구분</label>
                        <Tag value={CATEGORY_LABELS[todo.category] || '기타'} severity={null} />
                    </div>

                    <div className="col-12 md:col-3 mb-3">
                        <label className="block text-900 font-bold mb-1">상태</label>
                        <Tag
                            value={STATUS_LABELS[todo.status] || '알수없음'}
                            severity={STATUS_SEVERITIES[todo.status] as any}
                        />
                    </div>

                    <div className="col-12 md:col-3 mb-3">
                        <label className="block text-900 font-bold mb-1">시작일</label>
                        <div className="text-700">{dayjs(todo.startDate).format('YYYY-MM-DD')}</div>
                    </div>

                    <div className="col-12 md:col-3 mb-3">
                        <label className="block text-900 font-bold mb-1">종료일</label>
                        <div className="text-700">{dayjs(todo.endDate).format('YYYY-MM-DD')}</div>
                    </div>

                    {todo.status === 'HOLD' && todo.delayedReason && (
                        <div className="col-12 mb-3">
                            <label className="block text-red-500 font-bold mb-1">지연 사유</label>
                            <div className="p-2 border-round surface-50 text-red-600 border-1 border-red-200">
                                {todo.delayedReason}
                            </div>
                        </div>
                    )}

                    <div className="col-12 md:col-6 mb-3">
                        <label className="block text-900 font-bold mb-1">담당자</label>
                        <div className="flex flex-wrap gap-1">
                            {todo.assignees.map((item: TodoUser, idx: number) => {
                                const backgroundColor = getUserTagColor(item.userName);
                                return (
                                    <Tag
                                        key={idx}
                                        value={item.userName}
                                        style={{
                                            backgroundColor: backgroundColor,
                                            color: '#ffffff',
                                            borderRadius: '4px'
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    <div className="col-12">
                        <label className="block text-900 font-bold mb-1">상세 내용</label>
                        <div className="surface-card border-round border-1 surface-border p-2">
                            <CustomEditor
                                value={todo.content}
                                delta={todo.delta}
                                readOnly={true}
                                style={{ minHeight: '300px' }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default ToDoDetailModal;
