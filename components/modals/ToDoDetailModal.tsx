'use client';

import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { InputTextarea } from 'primereact/inputtextarea';
import dayjs from 'dayjs';
import { Todo, TodoUser } from '@/types/todo';
import { getUserTagColor } from '@/util/userTagColors';
import { CustomEditor } from '../editor/CustomEditor';

interface ToDoDetailModalProps {
    visible: boolean;
    onClose: (result?: any) => void;
    pData?: {
        todo: Todo;
        onToggleComplete: (todo: Todo) => void;
    };
}

const ToDoDetailModal: React.FC<ToDoDetailModalProps> = ({ visible, onClose, pData }) => {
    const todo = pData?.todo;
    const onToggleComplete = pData?.onToggleComplete;

    if (!todo) return null;

    const footer = (
        <div className="flex justify-content-end gap-2">
            {!todo.isCompleted && (
                <Button
                    label="완료 처리"
                    icon="pi pi-check"
                    className="p-button-success"
                    onClick={() => {
                        onToggleComplete?.(todo);
                        onClose();
                    }}
                />
            )}
            <Button label="닫기" icon="pi pi-times" className="p-button-text" onClick={() => onClose()} />
        </div>
    );

    return (
        <Dialog
            header="업무 상세 조회"
            visible={visible}
            style={{ width: '95vw' }}
            contentStyle={{ maxHeight: '70vh' }}
            footer={footer}
            onHide={() => onClose()}
            breakpoints={{ '960px': '75vw', '641px': '90vw' }}
            modal
        >
            <div className="p-3 surface-ground border-round">
                <div className="grid">
                    <div className="col-12 md:col-6 mb-3">
                        <label className="block text-900 font-bold mb-1">날짜</label>
                        <div className="text-700">{dayjs(todo.date).format('YYYY-MM-DD')}</div>
                    </div>
                    <div className="col-12 md:col-6 mb-3">
                        <label className="block text-900 font-bold mb-1">상태</label>
                        <Tag
                            value={todo.isCompleted ? '완료' : '진행 중'}
                            severity={todo.isCompleted ? 'success' : 'info'}
                        />
                    </div>
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
                    <div className="col-12 md:col-6 mb-3">
                        <label className="block text-900 font-bold mb-1">근무시간</label>
                        <div className="text-700">{todo.workingHours || '-'}</div>
                    </div>
                    <div className="col-12">
                        <label className="block text-1200 font-bold mb-1">업무 내용</label>
                        <CustomEditor value={todo.content} delta={todo.delta} readOnly={true} />
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default ToDoDetailModal;
