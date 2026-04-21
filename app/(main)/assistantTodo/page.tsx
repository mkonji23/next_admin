'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dayjs from 'dayjs';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';
import { Todo, TodoUser, TodoStatus } from '@/types/todo';
import { useCustomModal } from '@/hooks/useCustomModal';
import useAuthStore from '@/store/useAuthStore';
import { useHttp } from '@/util/axiosInstance';
import { getUserTagColor } from '@/util/userTagColors';

import TodoCalendar from './components/TodoCalendar';
import TodoList from './components/TodoList';
import TodoDetail from './components/TodoDetail';
import KanbanBoard from './components/KanbanBoard';

const AssistantTodoPage = () => {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
    const [viewMode, setViewMode] = useState<'calendar' | 'kanban'>('calendar');
    const [idChk, setIdCheck] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const { get, post } = useHttp();
    const { showToast } = useToast();
    const { showConfirm } = useConfirm();
    const { openModal } = useCustomModal();
    const { userInfo } = useAuthStore();
    const currentUserId = userInfo.userId;

    const fetchTodos = useCallback(async () => {
        try {
            const params: any = {
                userId: idChk ? currentUserId : '',
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
            showToast({ severity: 'error', summary: '조회 실패', detail: '목록을 불러오지 못했습니다.' });
        }
    }, [idChk, statusFilter, currentUserId]); // Removed showToast, get from deps

    useEffect(() => {
        fetchTodos();
    }, [fetchTodos]);

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
                summary: updated.status === 'COMPLETED' ? '완료 처리' : '진행 중 처리',
                detail: '업무 상태가 변경되었습니다.'
            });
        } catch (error) {
            showToast({ severity: 'error', summary: '처리 실패', detail: '상태 변경에 실패했습니다.' });
        }
    };

    const handleStatusChange = async (todo: Todo, newStatus: TodoStatus) => {
        try {
            const updated: Todo = { 
                ...todo, 
                status: newStatus,
                isCompleted: newStatus === 'COMPLETED'
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
        // result is null or true because handleSave might create multiple
        fetchTodos();
    };

    const events = useMemo(
        () =>
            todos.map((todo) => {
                let backgroundColor;
                if (todo.assignees?.length === 1) {
                    backgroundColor = getUserTagColor(todo.assignees[0].userName);
                } else {
                    backgroundColor = getUserTagColor('default');
                }

                if (todo.status === 'COMPLETED') {
                    backgroundColor = '#4caf50';
                } else if (todo.status === 'HOLD') {
                    backgroundColor = '#f44336';
                }

                return {
                    id: todo.id,
                    title: todo.title || todo.content,
                    start: dayjs(todo.startDate).format('YYYY-MM-DD'),
                    end: dayjs(todo.endDate).add(1, 'day').format('YYYY-MM-DD'), // FullCalendar end is exclusive
                    allDay: true,
                    backgroundColor: backgroundColor,
                    borderColor: backgroundColor,
                    textColor: '#ffffff',
                    extendedProps: {
                        description: todo.content,
                        assignees: todo.assignees,
                        category: todo.category
                    }
                };
            }),
        [todos]
    );

    return (
        <div className="grid">
            <div className="col-12 lg:col-8">
                <TodoCalendar
                    events={events}
                    onDateClick={(arg) => arg.jsEvent.detail === 2 && handleAdd(dayjs(arg.dateStr).toDate())}
                    onEventClick={(info) => {
                        const todo = todos.find(t => t.id === info.event.id);
                        if (todo) {
                            if (info.jsEvent.detail === 2) handleEdit(todo);
                            else setSelectedTodo(todo);
                        }
                    }}
                    onEventChange={async (info) => {
                        const todo = todos.find(t => t.id === info.event.id);
                        if (todo) {
                            const updated = { 
                                ...todo, 
                                startDate: dayjs(info.event.start).format('YYYY-MM-DD'),
                                endDate: dayjs(info.event.end ? dayjs(info.event.end).subtract(1, 'day') : info.event.start).format('YYYY-MM-DD')
                            };
                            try {
                                await post('/choiMath/todo/updateTodo', updated);
                                setTodos(prev => prev.map(t => t.id === todo.id ? updated : t));
                            } catch (e) {
                                info.revert();
                            }
                        }
                    }}
                    onDatesSet={() => {}}
                    onAddTodo={() => handleAdd()}
                    onChangeCheck={setIdCheck}
                    onStatusChange={setStatusFilter}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                />

                {viewMode === 'kanban' ? (
                    <KanbanBoard 
                        todos={todos}
                        onEdit={handleEdit}
                        onDetail={(todo) => {
                            setSelectedTodo(todo);
                            openModal({
                                id: 'todoDetailModal',
                                pData: { todo, onToggleComplete: handleToggleComplete }
                            }).then(res => res && fetchTodos());
                        }}
                        onStatusChange={handleStatusChange}
                    />
                ) : (
                    <TodoList
                        todos={todos}
                        selectedTodo={selectedTodo}
                        onSelectionChange={setSelectedTodo}
                        onEdit={handleEdit}
                        onToggleComplete={handleToggleComplete}
                        currentUserId={currentUserId}
                        onRefresh={fetchTodos}
                    />
                )}
            </div>

            <div className="col-12 lg:col-4">
                <TodoDetail
                    selectedTodo={selectedTodo}
                    onEdit={handleEdit}
                    onToggleComplete={handleToggleComplete}
                    onDelete={handleDelete}
                />
            </div>

            <style jsx global>{`
                .my-assigned-todo-row {
                    background-color: var(--primary-50) !important;
                }
                .my-assigned-todo-row-completed {
                    background-color: var(--surface-100) !important;
                    opacity: 0.8;
                }
                .kanban-view-container {
                    display: none;
                }
            `}</style>
        </div>
    );
};

export default AssistantTodoPage;
