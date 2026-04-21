'use client';

import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import dayjs from 'dayjs';
import { Todo, TodoUser, TodoStatus } from '@/types/todo';
import { useCustomModal } from '@/hooks/useCustomModal';
import { getUserTagColor } from '@/util/userTagColors';
import { STATUS_LABELS, CATEGORY_LABELS, STATUS_SEVERITIES } from '@/constants/todo';

interface TodoListProps {
    todos: Todo[];
    selectedTodo: Todo | null;
    onSelectionChange: (todo: Todo | null) => void;
    onEdit: (todo: Todo) => void;
    onStatusChange: (todo: Todo, status: TodoStatus) => void;
    currentUserId?: string;
    onRefresh?: () => void;
}

const TodoList: React.FC<TodoListProps> = ({
    todos,
    selectedTodo,
    onSelectionChange,
    onEdit,
    onStatusChange,
    onRefresh,
    currentUserId
}) => {
    const { openModal } = useCustomModal();

    const handleContentClick = async (todo: Todo) => {
        onSelectionChange(todo);
        const res = await openModal({
            id: 'todoDetailModal',
            pData: {
                todo,
                onStatusChange
            }
        });
        if (res) {
            onRefresh && onRefresh();
        }
    };

    return (
        <div className="card mt-4">
            <h5 className="flex align-items-center gap-2">
                <i className="pi pi-list text-primary"></i>할 일 목록 (리스트)
            </h5>
            <DataTable
                value={todos}
                paginator
                rows={10}
                dataKey="id"
                selectionMode="single"
                selection={selectedTodo}
                onSelectionChange={(e) => onSelectionChange(e.value as Todo)}
                emptyMessage="할 일이 없습니다."
                rowClassName={(rowData) => (rowData.id === selectedTodo?.id ? 'bg-blue-50' : '')}
                className="p-datatable-sm"
            >
                <Column
                    field="category"
                    header="구분"
                    sortable
                    body={(rowData) => <Tag value={CATEGORY_LABELS[rowData.category] || '기타'} severity={null} />}
                    headerStyle={{ width: '100px' }}
                />
                <Column
                    field="title"
                    header="업무 제목"
                    sortable
                    body={(rowData) => {
                        const isAssignedToCurrentUser = rowData.assignees.some(
                            (assignee: TodoUser) => assignee.userId === currentUserId
                        );
                        return (
                            <div className="flex align-items-center gap-2">
                                {isAssignedToCurrentUser && (
                                    <Tag
                                        value="내 업무"
                                        severity="warning"
                                        style={{ fontSize: '10px', padding: '2px 4px', height: 'fit-content' }}
                                    />
                                )}
                                <div
                                    className={`cursor-pointer font-bold hover:underline ${
                                        rowData.status === 'COMPLETED' ? 'text-400 line-through' : 'text-primary'
                                    }`}
                                    onClick={() => handleContentClick(rowData)}
                                    onDoubleClick={() => onEdit(rowData)}
                                >
                                    {!rowData.title || rowData.title === '제목없음'
                                        ? (rowData.content?.replace(/<[^>]*>/g, '').substring(0, 20) || '제목없음') +
                                          (rowData.content?.replace(/<[^>]*>/g, '').length > 20 ? '...' : '')
                                        : rowData.title}
                                </div>
                            </div>
                        );
                    }}
                />
                <Column
                    header="기간"
                    sortable
                    sortField="startDate"
                    body={(rowData) => (
                        <div className="text-xs text-600">
                            {dayjs(rowData.startDate).format('MM.DD')} ~ {dayjs(rowData.endDate).format('MM.DD')}
                        </div>
                    )}
                    headerStyle={{ width: '150px' }}
                />
                <Column
                    field="assignees"
                    header="담당자"
                    body={(rowData) => (
                        <div className="flex flex-wrap gap-1">
                            {rowData.assignees.map((item: TodoUser, idx: number) => {
                                const backgroundColor = getUserTagColor(item.userName);
                                return (
                                    <Tag
                                        key={idx}
                                        value={item.userName}
                                        style={{
                                            backgroundColor: backgroundColor,
                                            color: '#ffffff',
                                            borderRadius: '4px',
                                            fontSize: '0.7rem'
                                        }}
                                    />
                                );
                            })}
                        </div>
                    )}
                    headerStyle={{ width: '120px' }}
                />
                <Column
                    field="status"
                    header="상태"
                    sortable
                    body={(rowData) => (
                        <div className="flex align-items-center gap-2">
                            <Tag
                                value={STATUS_LABELS[rowData.status] || '진행 중'}
                                severity={STATUS_SEVERITIES[rowData.status] as any}
                            />
                        </div>
                    )}
                    headerStyle={{ width: '120px' }}
                />
            </DataTable>
        </div>
    );
};

export default TodoList;
