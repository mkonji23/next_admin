'use client';

import React, { useState } from 'react';
import { Todo, TodoStatus } from '@/types/todo';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { getUserTagColor } from '@/util/userTagColors';
import dayjs from 'dayjs';
import { STATUS_LABELS, CATEGORY_LABELS } from '@/constants/todo';

interface KanbanBoardProps {
    todos: Todo[];
    onEdit: (todo: Todo) => void;
    onDetail: (todo: Todo) => void;
    onStatusChange: (todo: Todo, newStatus: TodoStatus) => void;
}

// Internal Badge component moved to top to avoid hoisting issues
const KanbanBadge = ({ value, severity }: { value: number; severity: string }) => {
    const bgMap: any = {
        success: 'bg-green-500',
        danger: 'bg-red-500',
        info: 'bg-blue-500',
        warning: 'bg-orange-500'
    };
    return (
        <span
            className={`${
                bgMap[severity] || 'bg-gray-500'
            } text-white border-circle flex align-items-center justify-content-center text-xs`}
            style={{ width: '1.5rem', height: '1.5rem' }}
        >
            {value}
        </span>
    );
};

const KanbanBoard: React.FC<KanbanBoardProps> = ({ todos, onEdit, onDetail, onStatusChange }) => {
    const columns: TodoStatus[] = ['PENDING', 'IN_PROGRESS', 'HOLD', 'COMPLETED'];
    const [draggedTodo, setDraggedTodo] = useState<Todo | null>(null);

    const getColumnTodos = (status: TodoStatus) => {
        return todos.filter((t) => (t.status || (t.isCompleted ? 'COMPLETED' : 'PENDING')) === status);
    };

    const onDragStart = (todo: Todo) => {
        setDraggedTodo(todo);
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const onDrop = (status: TodoStatus) => {
        if (draggedTodo && draggedTodo.status !== status) {
            onStatusChange(draggedTodo, status);
        }
        setDraggedTodo(null);
    };

    const renderCard = (todo: Todo) => {
        const assignees = todo.assignees || [];

        return (
            <div
                key={todo.id}
                draggable="true"
                onDragStart={() => onDragStart(todo)}
                className="mb-3 cursor-grab active:cursor-grabbing"
            >
                <Card
                    className="kanban-card shadow-1 hover:shadow-3 transition-all transition-duration-200"
                    style={{
                        borderLeft: `4px solid ${getUserTagColor(assignees[0]?.userName || 'default')}`
                    }}
                    onClick={() => onDetail(todo)}
                >
                    <div className="flex justify-content-between align-items-start mb-2">
                        <Tag
                            value={CATEGORY_LABELS[todo.category] || '기타'}
                            severity="secondary"
                            style={{ fontSize: '0.7rem' }}
                        />
                        <div className="flex gap-1">
                            <Button
                                icon="pi pi-pencil"
                                className="p-button-rounded p-button-text p-button-sm p-0 w-2rem h-2rem"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(todo);
                                }}
                            />
                        </div>
                    </div>

                    <div className="font-bold mb-2 text-900 line-height-3">
                        {!todo.title || todo.title === '제목없음'
                            ? (todo.content?.replace(/<[^>]*>/g, '').substring(0, 10) || '제목없음') +
                              (todo.content?.replace(/<[^>]*>/g, '').length > 10 ? '...' : '')
                            : todo.title}
                    </div>

                    <div className="text-sm text-600 mb-3 flex align-items-center gap-1">
                        <i className="pi pi-calendar text-xs"></i>
                        {dayjs(todo.startDate).format('MM.DD')} ~ {dayjs(todo.endDate).format('MM.DD')}
                    </div>

                    {todo.status === 'HOLD' && todo.delayedReason && (
                        <div className="text-xs text-red-500 mb-2 font-semibold">사유: {todo.delayedReason}</div>
                    )}

                    <div className="flex justify-content-between align-items-center">
                        <div className="flex flex-wrap gap-1">
                            {assignees.map((user, idx) => (
                                <Tag
                                    key={idx}
                                    value={user.userName}
                                    style={{
                                        backgroundColor: getUserTagColor(user.userName),
                                        color: '#ffffff',
                                        borderRadius: '4px',
                                        fontSize: '0.65rem'
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </Card>
            </div>
        );
    };

    return (
        <div className="grid kanban-container flex-nowrap overflow-x-auto pb-3" style={{ minHeight: '70vh' }}>
            {columns.map((status) => (
                <div key={status} className="col-12 md:col-3 min-w-20rem">
                    <div
                        className="kanban-column surface-ground border-round p-3 h-full"
                        onDragOver={onDragOver}
                        onDrop={() => onDrop(status)}
                    >
                        <div className="flex align-items-center justify-content-between mb-3 px-1">
                            <h6 className="m-0 flex align-items-center gap-2">
                                {STATUS_LABELS[status]}
                                <KanbanBadge
                                    value={getColumnTodos(status).length}
                                    severity={
                                        status === 'COMPLETED'
                                            ? 'success'
                                            : status === 'HOLD'
                                            ? 'danger'
                                            : status === 'IN_PROGRESS'
                                            ? 'info'
                                            : 'warning'
                                    }
                                />
                            </h6>
                        </div>

                        <div className="kanban-cards-container" style={{ minHeight: '100px' }}>
                            {getColumnTodos(status).map((todo) => renderCard(todo))}
                            {getColumnTodos(status).length === 0 && (
                                <div className="text-center p-4 text-500 text-sm border-2 border-dashed surface-border border-round">
                                    업무가 없습니다
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            <style jsx>{`
                .kanban-container::-webkit-scrollbar {
                    height: 8px;
                }
                .kanban-container::-webkit-scrollbar-track {
                    background: var(--surface-ground);
                }
                .kanban-container::-webkit-scrollbar-thumb {
                    background: var(--surface-300);
                    border-radius: 10px;
                }
                .kanban-card {
                    background: var(--surface-card);
                }
                .kanban-card:hover {
                    transform: translateY(-2px);
                }
                .cursor-grab {
                    cursor: grab;
                }
                .cursor-grabbing {
                    cursor: grabbing;
                }
            `}</style>
        </div>
    );
};

export default KanbanBoard;
