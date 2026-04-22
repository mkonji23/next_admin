'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';
import { Todo, TodoStatus } from '@/types/todo';
import TodoCalendar from './components/TodoCalendar';
import TodoList from './components/TodoList';
import TodoDetail from './components/TodoDetail';
import dayjs from 'dayjs';
import { useCustomModal } from '@/hooks/useCustomModal';
import useAuthStore from '@/store/useAuthStore';
import { Button } from 'primereact/button';

const AssistantTodoPage = () => {
    const { get, post } = useHttp();
    const { showToast } = useToast();
    const { showConfirm } = useConfirm();
    const { userInfo } = useAuthStore();
    const currentUserId = userInfo?.userId || '';
    const { openModal } = useCustomModal();

    const [todos, setTodos] = useState<Todo[]>([]);
    const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
    const [viewMode, setViewMode] = useState<'calendar' | 'kanban'>('calendar');
    const [statusFilter, setStatusFilter] = useState('all');
    const [idChk, setIdChk] = useState(true);
    const [showDetail, setShowDetail] = useState(true);

    const fetchTodos = useCallback(async () => {
        try {
            const params: any = {
                userId: idChk ? currentUserId : ''
            };

            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }

            const response = await get('/choiMath/todo/getTodoList', { params });
            setTodos(response.data || []);

            if (selectedTodo) {
                const rTodo = response.data?.find((item: Todo) => item.id === selectedTodo.id);
                if (rTodo) setSelectedTodo(rTodo);
            }
        } catch (error) {
            showToast({ severity: 'error', summary: '실패', detail: '할 일 목록을 가져오는 데 실패했습니다.' });
        }
    }, [statusFilter, idChk, currentUserId]);

    useEffect(() => {
        if (currentUserId) {
            fetchTodos();
        }
    }, [idChk, statusFilter, currentUserId]);

    const handleToggleComplete = async (todo: Todo) => {
        try {
            const isCompleted = todo.status !== 'COMPLETED';
            const updated: Todo = {
                ...todo,
                isCompleted,
                status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS'
            };
            await post('/choiMath/todo/updateTodo', updated);
            setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)));

            if (selectedTodo?.id === todo.id) {
                setSelectedTodo(updated);
            }

            showToast({
                severity: 'success',
                summary: '성공',
                detail: isCompleted ? '업무가 완료 처리되었습니다.' : '업무가 다시 진행 중으로 변경되었습니다.'
            });
        } catch (error) {
            showToast({ severity: 'error', summary: '실패', detail: '업무 상태 변경에 실패했습니다.' });
        }
    };

    const handleStatusChange = async (todo: Todo, newStatus: TodoStatus, delayedReason?: string) => {
        try {
            const updated: Todo = {
                ...todo,
                status: newStatus,
                isCompleted: newStatus === 'COMPLETED',
                ...(newStatus === 'HOLD' && delayedReason ? { delayedReason } : {})
            };
            await post('/choiMath/todo/updateTodo', updated);
            setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)));

            if (selectedTodo?.id === todo.id) {
                setSelectedTodo(updated);
            }

            showToast({ severity: 'success', summary: '상태 변경', detail: '업무 상태가 변경되었습니다.' });
        } catch (error) {
            showToast({ severity: 'error', summary: '실패', detail: '상태 변경에 실패했습니다.' });
        }
    };

    const handleDelete = async (id: string) => {
        const res = await showConfirm({ header: '항목 삭제', message: '정말로 이 항목을 삭제하시겠습니까?' });
        if (res) {
            try {
                await post('/choiMath/todo/deleteTodo', { id });
                setTodos((prev) => prev.filter((t) => t.id !== id));
                if (selectedTodo?.id === id) setSelectedTodo(null);
                showToast({ severity: 'success', summary: '삭제 성공', detail: '항목이 삭제되었습니다.' });
            } catch (error) {
                showToast({ severity: 'error', summary: '삭제 실패', detail: '항목 삭제 중 오류가 발생했습니다.' });
            }
        }
    };

    const handleEdit = async (todo: Todo) => {
        const result = await openModal<any, Todo | null>({
            id: 'todo',
            pData: { mode: 'edit', todo }
        });
        if (result) {
            fetchTodos();
        }
    };

    const handleAdd = async (initialDate?: Date) => {
        const result = await openModal<any, any>({
            id: 'todo',
            pData: { mode: 'new', initialDate }
        });
        if (result) {
            fetchTodos();
        }
    };

    const handleDetail = (todo: Todo) => {
        setSelectedTodo(todo);
        openModal({
            id: 'todoDetailModal',
            pData: { todo, onStatusChange: handleStatusChange }
        }).then((res) => res && fetchTodos());
    };

    const events = useMemo(
        () =>
            todos.map((todo) => ({
                id: todo.id,
                title: todo.title,
                start: dayjs(todo.startDate).format('YYYY-MM-DD'),
                end: dayjs(todo.endDate).add(1, 'day').format('YYYY-MM-DD'),
                allDay: true,
                backgroundColor:
                    todo.status === 'COMPLETED' ? '#22c55e' : todo.status === 'HOLD' ? '#ef4444' : '#3b82f6',
                borderColor: todo.status === 'COMPLETED' ? '#22c55e' : todo.status === 'HOLD' ? '#ef4444' : '#3b82f6',
                extendedProps: {
                    title: todo.title,
                    description: todo.content,
                    assignees: todo.assignees,
                    category: todo.category
                }
            })),
        [todos]
    );

    return (
        <div className="grid p-3">
            <div className={`col-12 ${showDetail ? 'lg:col-8' : 'lg:col-12'}`}>
                <div className="flex justify-content-end mb-2">
                    <Button
                        icon={showDetail ? 'pi pi-chevron-right' : 'pi pi-chevron-left'}
                        label={showDetail ? '상세 닫기' : '상세 열기'}
                        className="p-button-text p-button-sm"
                        onClick={() => setShowDetail(!showDetail)}
                    />
                </div>
                <TodoCalendar
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    todos={todos}
                    events={events}
                    onDateClick={(arg) => {
                        if (arg.jsEvent.detail === 2) {
                            handleAdd(dayjs(arg.dateStr).toDate());
                        } else {
                            setSelectedTodo(null);
                        }
                    }}
                    onEventClick={(info) => {
                        const todo = todos.find((t) => t.id === info.event.id);
                        if (todo) {
                            if (info.jsEvent.detail === 2) {
                                handleDetail(todo);
                            } else {
                                setSelectedTodo(todo);
                                setShowDetail(true);
                            }
                        }
                    }}
                    onEventChange={async (info) => {
                        const todo = todos.find((t) => t.id === info.event.id);
                        if (todo) {
                            const updated = {
                                ...todo,
                                startDate: dayjs(info.event.start).format('YYYY-MM-DD'),
                                endDate: dayjs(
                                    info.event.end ? dayjs(info.event.end).subtract(1, 'day') : info.event.start
                                ).format('YYYY-MM-DD')
                            };
                            try {
                                await post('/choiMath/todo/updateTodo', updated);
                                setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)));
                            } catch (e) {
                                info.revert();
                            }
                        }
                    }}
                    onDatesSet={(info) => {}}
                    onAddTodo={() => handleAdd()}
                    onEdit={handleEdit}
                    onDetail={handleDetail}
                    onChangeCheck={(value) => setIdChk(value)}
                    onStatusChange={(value) => setStatusFilter(value)}
                    onTodoStatusChange={handleStatusChange}
                />

                {viewMode === 'calendar' && (
                    <TodoList
                        todos={todos}
                        selectedTodo={selectedTodo}
                        onSelectionChange={(todo) => {
                            setSelectedTodo(todo);
                            if (todo) setShowDetail(true);
                        }}
                        onEdit={handleEdit}
                        onStatusChange={handleStatusChange}
                        currentUserId={currentUserId}
                        onRefresh={fetchTodos}
                    />
                )}
            </div>

            {showDetail && (
                <div className="col-12 lg:col-4" style={{ position: 'sticky', top: '1rem', height: 'fit-content' }}>
                    <TodoDetail
                        selectedTodo={selectedTodo}
                        onEdit={handleEdit}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
                        onClose={() => setShowDetail(false)}
                    />
                </div>
            )}

            <style jsx global>{`
                .calendar-container {
                    background: var(--surface-card);
                    padding: 1rem;
                    border-radius: 8px;
                }
                .fc .fc-toolbar-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                }
                .fc .fc-button-primary {
                    background-color: var(--primary-color);
                    border-color: var(--primary-color);
                }
                .fc .fc-button-primary:hover {
                    background-color: var(--primary-700);
                    border-color: var(--primary-700);
                }
                .fc .fc-button-primary:not(:disabled).fc-button-active,
                .fc .fc-button-primary:not(:disabled):active {
                    background-color: var(--primary-800);
                    border-color: var(--primary-800);
                }
                .fc-event {
                    cursor: pointer;
                    padding: 2px 4px;
                    border-radius: 4px;
                }
                .fc-daygrid-event-dot {
                    display: none;
                }
                .hide-toolbar .ql-container {
                    border: none !important;
                }
                .hide-toolbar .ql-editor {
                    overflow-y: visible !important;
                    height: auto !important;
                    padding: 0 !important;
                }
                .fc-day-sun .fc-col-header-cell-cushion,
                .fc-daygrid-day.fc-day-sun .fc-daygrid-day-number {
                    color: #e91e63 !important;
                }
                .fc-day-sat .fc-col-header-cell-cushion,
                .fc-daygrid-day.fc-day-sat .fc-daygrid-day-number {
                    color: #2196f3 !important;
                }
                .my-assigned-todo-row {
                    background-color: var(--yellow-400);
                }
                .my-assigned-todo-row-completed {
                    background-color: #fa90ce;
                }
            `}</style>
        </div>
    );
};

export default AssistantTodoPage;
