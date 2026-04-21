'use client';

import React from 'react';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import dayjs from 'dayjs';
import { Todo, TodoUser } from '@/types/todo';
import { getUserTagColor } from '@/util/userTagColors';
import { CustomEditor } from '@/components/editor/CustomEditor';
import { Card } from 'primereact/card';
import { STATUS_LABELS, CATEGORY_LABELS, STATUS_SEVERITIES } from '@/constants/todo';

interface TodoDetailProps {
    selectedTodo: Todo | null;
    onEdit: (todo: Todo) => void;
    onToggleComplete: (todo: Todo) => void;
    onDelete: (id: string) => void;
}

const TodoDetail: React.FC<TodoDetailProps> = ({ selectedTodo, onEdit, onToggleComplete, onDelete }) => {
    return (
        <Card className="shadow-2 border-round-2xl">
            <div className="flex justify-content-between align-items-center mb-4">
                <h5 className="m-0 font-bold">업무 상세 정보</h5>
                {selectedTodo && (
                    <div className="flex gap-1">
                        <Button
                            icon="pi pi-pencil"
                            className="p-button-rounded p-button-warning p-button-sm"
                            onClick={() => onEdit(selectedTodo)}
                            tooltip="수정"
                        />
                        <Button
                            icon={selectedTodo.status === 'COMPLETED' ? 'pi pi-refresh' : 'pi pi-check'}
                            className={`p-button-rounded p-button-sm ${
                                selectedTodo.status === 'COMPLETED' ? 'p-button-secondary' : 'p-button-success'
                            }`}
                            onClick={() => onToggleComplete(selectedTodo)}
                            tooltip={selectedTodo.status === 'COMPLETED' ? '되돌리기' : '완료 처리'}
                        />
                        <Button
                            icon="pi pi-trash"
                            className="p-button-rounded p-button-danger p-button-sm"
                            onClick={() => onDelete(selectedTodo.id)}
                            tooltip="삭제"
                        />
                    </div>
                )}
            </div>

            {selectedTodo ? (
                <div className="flex flex-column gap-3">
                    <div className="surface-card p-3 border-round border-1 surface-border">
                        <div className="text-xl font-bold text-900 mb-2">{selectedTodo.title}</div>
                        <div className="flex gap-2 mb-2">
                            <Tag value={CATEGORY_LABELS[selectedTodo.category] || '기타'} severity="secondary" />
                            <Tag value={STATUS_LABELS[selectedTodo.status] || '알수없음'} severity={STATUS_SEVERITIES[selectedTodo.status] as any} />
                        </div>
                        <div className="text-sm text-600 flex align-items-center gap-1">
                            <i className="pi pi-calendar text-xs"></i>
                            {dayjs(selectedTodo.startDate).format('YYYY-MM-DD')} ~ {dayjs(selectedTodo.endDate).format('YYYY-MM-DD')}
                        </div>
                    </div>

                    {selectedTodo.status === 'HOLD' && selectedTodo.delayedReason && (
                        <div className="p-3 bg-red-50 border-round border-1 border-red-200">
                            <div className="text-xs text-red-500 font-bold mb-1">HOLD 사유</div>
                            <div className="text-red-700 text-sm font-medium">{selectedTodo.delayedReason}</div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-600 mb-1">담당자</label>
                        <div className="flex flex-wrap gap-1">
                            {selectedTodo.assignees.map((item: TodoUser, idx: number) => {
                                const backgroundColor = getUserTagColor(item.userName);
                                return (
                                    <Tag
                                        key={idx}
                                        value={item.userName}
                                        style={{
                                            backgroundColor: backgroundColor,
                                            color: '#ffffff',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem'
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-2">
                        <label className="block text-sm font-bold text-600 mb-1">상세 내용</label>
                        <div className="surface-ground p-3 border-round text-sm line-height-3 text-800" style={{ maxHeight: '400px', overflowY: 'auto' }}>
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
                <div className="flex flex-column align-items-center justify-content-center h-full py-8 text-400">
                    <i className="pi pi-inbox mb-3" style={{ fontSize: '3rem' }}></i>
                    <span className="font-medium">업무를 선택해주세요</span>
                    <small className="mt-2 text-500">캘린더나 리스트에서 업무를 클릭하세요</small>
                </div>
            )}
        </Card>
    );
};

export default TodoDetail;
