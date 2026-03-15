'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import { Button } from 'primereact/button';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';
import { Todo, TodoUser } from '@/types/todo';
import { useCustomModal } from '@/hooks/useCustomModal';

// 신규 컴포넌트 임포트
import TodoCalendar from './components/TodoCalendar';
import TodoList from './components/TodoList';
import TodoDetail from './components/TodoDetail';
import { useHttp } from '@/util/axiosInstance';

const AssistantTodoPage = () => {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
    const [currentDate, setCurrentDate] = useState({
        start: dayjs().startOf('month').format('YYYY-MM-DD'),
        end: dayjs().endOf('month').format('YYYY-MM-DD')
    });

    const { get, post } = useHttp();
    const { showToast } = useToast();
    const { showConfirm } = useConfirm();
    const { openModal } = useCustomModal();

    const fetchTodos = useCallback(async () => {
        try {
            const response = await get('/choiMath/todo/getTodoList', {
                params: {
                    startDate: currentDate.start,
                    endDate: currentDate.end
                }
            });
            setTodos(response.data);
        } catch (error) {
            showToast({ severity: 'error', summary: '조회 실패', detail: '목록을 불러오지 못했습니다.' });
        }
    }, [currentDate, showToast]);

    useEffect(() => {
        fetchTodos();
    }, [fetchTodos]);

    const handleToggleComplete = async (todo: Todo) => {
        try {
            const updated = { ...todo, isCompleted: !todo.isCompleted };
            await post('/choiMath/todo/updateTodo', updated);
            setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)));

            if (selectedTodo?.id === todo.id) {
                setSelectedTodo(updated);
            }

            showToast({
                severity: 'success',
                summary: updated.isCompleted ? '완료 처리' : '진행 중 처리',
                detail: updated.isCompleted ? '업무 상태가 변경되었습니다.' : '업무 상태가 진행 중으로 변경되었습니다.'
            });
        } catch (error) {
            showToast({ severity: 'error', summary: '처리 실패', detail: '상태 변경에 실패했습니다.' });
        }
    };

    const handleDelete = async (id: string) => {
        const res = await showConfirm({ header: '항목 삭제', message: '정말로 이 항목을 삭제하시겠습니까?' });
        if (res) {
            await post('/choiMath/todo/deleteTodo', { id });
            setTodos((prev) => prev.filter((t) => t.id !== id));
            if (selectedTodo?.id === id) setSelectedTodo(null);
            showToast({ severity: 'success', summary: '삭제 성공', detail: '항목이 삭제되었습니다.' });
        }
    };

    const handleEdit = async (todo: Todo) => {
        const result = await openModal<any, Todo | null>({
            id: 'todo',
            pData: { mode: 'edit', todo }
        });
        if (result) {
            fetchTodos();
            if (selectedTodo?.id === result.id) {
                setSelectedTodo(result);
            }
        }
    };

    const handleAdd = async (initialDate?: Date) => {
        const result = await openModal<any, Todo | null>({
            id: 'todo',
            pData: { mode: 'new', initialDate }
        });
        if (result) {
            fetchTodos();
        }
    };

    const handleDateClick = (arg: any) => {
        // 더블클릭시
        if (arg.jsEvent.detail === 2) {
            handleAdd(dayjs(arg.dateStr).toDate());
        } else {
            setSelectedTodo(null);
        }
    };

    const handleEventClick = (clickInfo: any) => {
        const todo = todos.find((t) => t.id === clickInfo.event.id);
        // 더블클릭시
        if (clickInfo.jsEvent.detail === 2) {
            todo && handleEdit(todo);
            return;
        } else {
            if (todo) setSelectedTodo(todo);
        }
    };

    const handleEventChange = async (changeInfo: any) => {
        const { event } = changeInfo;
        const todo = todos.find((t) => t.id === event.id);
        if (todo) {
            const updated = { ...todo, date: dayjs(event.start).format('YYYY-MM-DD') };
            try {
                await post('/choiMath/todo/updateTodo', updated);
                setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)));
                showToast({ severity: 'success', summary: '이동 성공', detail: '날짜가 변경되었습니다.' });
            } catch (error) {
                changeInfo.revert();
                showToast({ severity: 'error', summary: '이동 실패', detail: '날짜 변경에 실패했습니다.' });
            }
        }
    };

    const handleDatesSet = (dateInfo: any) => {
        setCurrentDate({
            start: dayjs(dateInfo.start).format('YYYY-MM-DD'),
            end: dayjs(dateInfo.end).format('YYYY-MM-DD')
        });
    };

    const events = todos.map((todo) => ({
        id: todo.id,
        title: todo.content,
        start: todo.date,
        allDay: true,
        backgroundColor: todo.isCompleted ? '#4caf50' : '#2196f3',
        borderColor: todo.isCompleted ? '#4caf50' : '#2196f3'
    }));

    return (
        <div className="grid">
            <div className="col-12 lg:col-8">
                <TodoCalendar
                    events={events}
                    onDateClick={handleDateClick}
                    onEventClick={handleEventClick}
                    onEventChange={handleEventChange}
                    onDatesSet={handleDatesSet}
                    onAddTodo={() => handleAdd()}
                />

                <TodoList
                    todos={todos}
                    selectedTodo={selectedTodo}
                    onSelectionChange={setSelectedTodo}
                    onEdit={handleEdit}
                    onToggleComplete={handleToggleComplete}
                />
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
                /* 요일 및 날짜 색상 처리 */
                /* 일요일 (Red) */
                .fc-day-sun .fc-col-header-cell-cushion,
                .fc-daygrid-day.fc-day-sun .fc-daygrid-day-number {
                    color: #e91e63 !important; /* Material Pink/Red */
                }
                /* 토요일 (Blue) */
                .fc-day-sat .fc-col-header-cell-cushion,
                .fc-daygrid-day.fc-day-sat .fc-daygrid-day-number {
                    color: #2196f3 !important; /* Material Blue */
                }
            `}</style>
        </div>
    );
};

export default AssistantTodoPage;
