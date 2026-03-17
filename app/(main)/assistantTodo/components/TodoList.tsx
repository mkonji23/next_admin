import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { InputSwitch } from 'primereact/inputswitch';
import dayjs from 'dayjs';
import { Todo, TodoUser } from '@/types/todo';
import { useCustomModal } from '@/hooks/useCustomModal';

interface TodoListProps {
    todos: Todo[];
    selectedTodo: Todo | null;
    onSelectionChange: (todo: Todo | null) => void;
    onEdit: (todo: Todo) => void;
    onToggleComplete: (todo: Todo) => void;
    currentUserId?: string;
}

const TodoList: React.FC<TodoListProps> = ({
    todos,
    selectedTodo,
    onSelectionChange,
    onEdit,
    onToggleComplete,
    currentUserId
}) => {
    const { openModal } = useCustomModal();

    const handleContentClick = (todo: Todo) => {
        onSelectionChange(todo);
        openModal({
            id: 'todoDetailModal',
            pData: {
                todo,
                onToggleComplete
            }
        });
    };

    return (
        <div className="card mt-4">
            <h5>할 일 목록(리스트)</h5>
            <DataTable
                value={todos}
                paginator
                rows={10}
                dataKey="id"
                selectionMode="single"
                selection={selectedTodo}
                onSelectionChange={(e) => onSelectionChange(e.value as Todo)}
                emptyMessage="할 일이 없습니다."
                rowClassName={(rowData) => {
                    const isAssignedToCurrentUser = rowData.assignees.some(
                        (assignee: TodoUser) => assignee.userId === currentUserId
                    );
                    if (isAssignedToCurrentUser) {
                        if (rowData.isCompleted) return 'my-assigned-todo-row-completed';
                        return 'my-assigned-todo-row-completed';
                    }

                    return '';
                }}
            >
                <Column
                    field="date"
                    header="날짜"
                    sortable
                    body={(rowData) => dayjs(rowData.date).format('YYYY-MM-DD')}
                    style={{ width: '15%' }}
                />
                <Column
                    field="content"
                    header="업무 내용"
                    sortable
                    style={{ width: '40%' }}
                    bodyClassName={'field-highlight'}
                    body={(rowData) => (
                        <div
                            className="truncate-cell cursor-pointer text-blue-500 font-semibold hover:underline"
                            onClick={() => handleContentClick(rowData)}
                            onDoubleClick={() => onEdit(rowData)}
                        >
                            {rowData.content}
                        </div>
                    )}
                />
                <Column
                    field="assignees"
                    header="담당자"
                    body={(rowData) => (
                        <div className="flex flex-wrap gap-1">
                            {rowData.assignees.map((item: TodoUser, idx: number) => (
                                <Tag key={idx} value={item.userName} severity="info" />
                            ))}
                        </div>
                    )}
                    style={{ width: '20%' }}
                />
                <Column field="workingHours" header="근무시간" style={{ width: '10%' }} />
                <Column
                    field="isCompleted"
                    header="상태"
                    sortable
                    body={(rowData) => (
                        <div className="flex align-items-center gap-2">
                            <InputSwitch checked={rowData.isCompleted} onChange={() => onToggleComplete(rowData)} />
                            <Tag
                                value={rowData.isCompleted ? '완료' : '진행 중'}
                                severity={rowData.isCompleted ? 'success' : 'warning'}
                            />
                        </div>
                    )}
                    style={{ width: '15%' }}
                />
            </DataTable>
        </div>
    );
};

export default TodoList;
