'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';
import { Todo, TodoStatus } from '@/types/todo';
import TodoCalendar from './components/TodoCalendar';
import TodoList from './components/TodoList';
import dayjs from 'dayjs';
import { useCustomModal } from '@/hooks/useCustomModal';
import useAuthStore from '@/store/useAuthStore';

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
        fetchTodos();
    }, [idChk, statusFilter, currentUserId, fetchTodos]);

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
        <div className="p-3">
            <TodoCalendar
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                todos={todos}
                events={events}
                onDateClick={(arg) => arg.jsEvent.detail === 2 && handleAdd(dayjs(arg.dateStr).toDate())}
                onEventClick={(info) => {
                    const todo = todos.find((t) => t.id === info.event.id);
                    if (todo) {
                        if (info.jsEvent.detail === 2) handleEdit(todo);
                        else handleDetail(todo);
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
                onChangeCheck={(value) => {
                    console.log('setIdChk(value)', value);
                    setIdChk(value);
                }}
                onStatusChange={setStatusFilter}
                onTodoStatusChange={handleStatusChange}
            />

            {viewMode === 'calendar' && (
                <TodoList
                    todos={todos}
                    selectedTodo={selectedTodo}
                    onSelectionChange={setSelectedTodo}
                    onEdit={handleEdit}
                    currentUserId={currentUserId}
                    onRefresh={fetchTodos}
                    onStatusChange={handleStatusChange}
                />
            )}
        </div>
    );
};

export default AssistantTodoPage;
