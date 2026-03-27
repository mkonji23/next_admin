import React from 'react';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { InputTextarea } from 'primereact/inputtextarea';
import dayjs from 'dayjs';
import { Todo, TodoUser } from '@/types/todo';
import { getUserTagColor } from '@/util/userTagColors';
import { CustomEditor } from '@/components/editor/CustomEditor';

interface TodoDetailProps {
    selectedTodo: Todo | null;
    onEdit: (todo: Todo) => void;
    onToggleComplete: (todo: Todo) => void;
    onDelete: (id: string) => void;
}

const TodoDetail: React.FC<TodoDetailProps> = ({ selectedTodo, onEdit, onToggleComplete, onDelete }) => {
    return (
        <div className="card h-screen">
            <div className="flex justify-content-between align-items-center mb-4">
                <h5 className="m-0">업무 상세 내용</h5>
                {selectedTodo && (
                    <div className="flex gap-2">
                        <Button
                            icon="pi pi-pencil"
                            className="p-button-rounded p-button-warning p-button-sm"
                            onClick={() => onEdit(selectedTodo)}
                            tooltip="수정"
                        />
                        <Button
                            icon={selectedTodo.isCompleted ? 'pi pi-times' : 'pi pi-check'}
                            className={`p-button-rounded p-button-sm ${
                                selectedTodo.isCompleted ? 'p-button-secondary' : 'p-button-success'
                            }`}
                            onClick={() => onToggleComplete(selectedTodo)}
                            tooltip={selectedTodo.isCompleted ? '진행 중으로 변경' : '완료 처리'}
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
                <div className="p-3 surface-ground border-round">
                    <div className="mb-3">
                        <label className="block text-900 font-bold mb-1">날짜</label>
                        <div className="text-700">{dayjs(selectedTodo.date).format('YYYY-MM-DD')}</div>
                    </div>
                    <div className="mb-3">
                        <label className="block text-900 font-bold mb-1">담당자</label>
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
                                            borderRadius: '4px'
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                    <div className="mb-3">
                        <label className="block text-900 font-bold mb-1">근무시간</label>
                        <div className="text-700">{selectedTodo.workingHours || '-'}</div>
                    </div>
                    <div className="mb-3">
                        <label className="block text-900 font-bold mb-1">업무 내용</label>
                        <CustomEditor value={selectedTodo.content} delta={selectedTodo.delta} readOnly={true} />
                    </div>
                    <div>
                        <label className="block text-900 font-bold mb-1">상태</label>
                        <Tag
                            value={selectedTodo.isCompleted ? '완료' : '진행 중'}
                            severity={selectedTodo.isCompleted ? 'success' : 'info'}
                        />
                    </div>
                </div>
            ) : (
                <div className="flex flex-column align-items-center justify-content-center h-full py-8 text-400">
                    <i className="pi pi-info-circle mb-2" style={{ fontSize: '2rem' }}></i>
                    <span>캘린더에서 업무를 선택하면 상세 내용이 표시됩니다.</span>
                    <small className="mt-2">(더블 클릭 시 수정 팝업)</small>
                </div>
            )}
        </div>
    );
};

export default TodoDetail;
