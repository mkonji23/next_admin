'use client';

import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import dayjs from 'dayjs';
import { Todo, TodoUser, TodoStatus } from '@/types/todo';
import { getUserTagColor } from '@/util/userTagColors';
import { CustomEditor } from '@/components/editor/CustomEditor';
import { Card } from 'primereact/card';
import { STATUS_LABELS, CATEGORY_LABELS, STATUS_SEVERITIES } from '@/constants/todo';

interface TodoDetailProps {
    selectedTodo: Todo | null;
    onEdit: (todo: Todo) => void;
    onStatusChange: (todo: Todo, status: TodoStatus, delayedReason?: string) => void;
    onDelete: (id: string) => void;
    onClose?: () => void;
}

const TodoDetail: React.FC<TodoDetailProps> = ({ selectedTodo, onEdit, onStatusChange, onDelete, onClose }) => {
    const [holdDialogVisible, setHoldDialogVisible] = useState(false);
    const [delayedReason, setDelayedReason] = useState('');

    const handleHoldSubmit = () => {
        if (selectedTodo) {
            onStatusChange(selectedTodo, 'HOLD', delayedReason);
            setHoldDialogVisible(false);
            setDelayedReason('');
        }
    };

    const renderActionButtons = () => {
        if (!selectedTodo) return null;

        return (
            <div className="flex gap-1">
                {selectedTodo.status === 'PENDING' && (
                    <Button
                        icon="pi pi-play"
                        className="p-button-rounded p-button-info p-button-sm"
                        onClick={() => onStatusChange(selectedTodo, 'IN_PROGRESS')}
                        tooltip="진행 시작"
                    />
                )}
                {selectedTodo.status === 'IN_PROGRESS' && (
                    <>
                        <Button
                            icon="pi pi-check"
                            className="p-button-rounded p-button-success p-button-sm"
                            onClick={() => onStatusChange(selectedTodo, 'COMPLETED')}
                            tooltip="완료 처리"
                        />
                        <Button
                            icon="pi pi-pause"
                            className="p-button-rounded p-button-danger p-button-sm"
                            onClick={() => {
                                setDelayedReason(selectedTodo.delayedReason || '');
                                setHoldDialogVisible(true);
                            }}
                            tooltip="보류/지연"
                        />
                    </>
                )}
                {selectedTodo.status === 'HOLD' && (
                    <Button
                        icon="pi pi-check"
                        className="p-button-rounded p-button-success p-button-sm"
                        onClick={() => onStatusChange(selectedTodo, 'COMPLETED')}
                        tooltip="완료 처리"
                    />
                )}
                {selectedTodo.status === 'COMPLETED' && (
                    <Button
                        icon="pi pi-refresh"
                        className="p-button-rounded p-button-info p-button-sm"
                        onClick={() => onStatusChange(selectedTodo, 'IN_PROGRESS')}
                        tooltip="다시 진행"
                    />
                )}
                <Button
                    icon="pi pi-pencil"
                    className="p-button-rounded p-button-warning p-button-sm"
                    onClick={() => onEdit(selectedTodo)}
                    tooltip="수정"
                />
                <Button
                    icon="pi pi-trash"
                    className="p-button-rounded p-button-danger p-button-sm"
                    onClick={() => onDelete(selectedTodo.id)}
                    tooltip="삭제"
                />
            </div>
        );
    };

    const holdDialogFooter = (
        <div className="flex justify-content-end gap-2">
            <Button label="취소" icon="pi pi-times" className="p-button-text" onClick={() => setHoldDialogVisible(false)} />
            <Button label="확인" icon="pi pi-check" onClick={handleHoldSubmit} autoFocus />
        </div>
    );

    return (
        <>
            <Card className="shadow-2 border-round-2xl h-full">
                <div className="flex justify-content-between align-items-center mb-4">
                    <div className="flex align-items-center gap-2">
                        {onClose && (
                            <Button
                                icon="pi pi-times"
                                className="p-button-rounded p-button-text p-button-secondary p-button-sm"
                                onClick={onClose}
                                tooltip="닫기"
                            />
                        )}
                        <h5 className="m-0 font-bold flex align-items-center gap-2">
                            <i className="pi pi-info-circle text-primary"></i>
                            상세 정보
                        </h5>
                    </div>
                    {renderActionButtons()}
                </div>

                {selectedTodo ? (
                    <div className="flex flex-column gap-3">
                        <div className="surface-card p-4 border-round-xl border-1 surface-border">
                            <div className="text-2xl font-bold text-900 mb-3">{selectedTodo.title}</div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                <Tag value={CATEGORY_LABELS[selectedTodo.category] || '기타'} severity={null} />
                                <Tag
                                    value={STATUS_LABELS[selectedTodo.status] || '알수없음'}
                                    severity={STATUS_SEVERITIES[selectedTodo.status] as any}
                                />
                            </div>

                            <div className="grid">
                                <div className="col-6">
                                    <label className="block text-500 text-xs mb-1">시작일</label>
                                    <div className="text-900 font-medium">{dayjs(selectedTodo.startDate).format('YYYY-MM-DD')}</div>
                                </div>
                                <div className="col-6">
                                    <label className="block text-500 text-xs mb-1">종료일</label>
                                    <div className="text-900 font-medium">{dayjs(selectedTodo.endDate).format('YYYY-MM-DD')}</div>
                                </div>
                            </div>
                        </div>

                        <div className="surface-card p-4 border-round-xl border-1 surface-border">
                            <label className="block text-900 font-bold mb-2">담당자</label>
                            <div className="flex flex-wrap gap-1">
                                {selectedTodo.assignees?.map((user: TodoUser, idx: number) => (
                                    <Tag
                                        key={idx}
                                        value={user.userName}
                                        style={{
                                            backgroundColor: getUserTagColor(user.userName),
                                            color: '#ffffff',
                                            borderRadius: '4px'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {selectedTodo.delayedReason && (
                            <div className="surface-card p-4 border-round-xl border-1 border-red-200 bg-red-50">
                                <label className="block text-red-700 font-bold mb-2">지연 사유</label>
                                <div className="text-red-600">{selectedTodo.delayedReason}</div>
                            </div>
                        )}

                        <div className="surface-card p-4 border-round-xl border-1 surface-border">
                            <label className="block text-900 font-bold mb-2">상세 내용</label>
                            <div className="p-0">
                                <CustomEditor
                                    value={selectedTodo.content}
                                    delta={selectedTodo.delta}
                                    readOnly={true}
                                    style={{ height: 'auto', minHeight: '100px' }}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-column align-items-center justify-content-center py-8 text-500 surface-50 border-round-xl border-1 border-dashed surface-border" style={{ minHeight: '300px' }}>
                        <i className="pi pi-mouse text-4xl mb-3"></i>
                        <p>업무를 선택하면 상세 정보를 볼 수 있습니다.</p>
                    </div>
                )}
            </Card>

            <Dialog
                header="보류 사유 입력"
                visible={holdDialogVisible}
                style={{ width: '400px' }}
                footer={holdDialogFooter}
                onHide={() => setHoldDialogVisible(false)}
            >
                <div className="flex flex-column gap-2 mt-2">
                    <label htmlFor="delayedReason" className="font-bold">사유</label>
                    <InputTextarea
                        id="delayedReason"
                        value={delayedReason}
                        onChange={(e) => setDelayedReason(e.target.value)}
                        rows={3}
                        autoResize
                        className="w-full"
                        placeholder="보류 또는 지연 사유를 입력하세요"
                    />
                </div>
            </Dialog>
        </>
    );
};

export default TodoDetail;
