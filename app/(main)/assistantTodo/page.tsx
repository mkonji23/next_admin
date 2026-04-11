'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dayjs from 'dayjs';
import { Button } from 'primereact/button';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';
import { Todo, TodoUser } from '@/types/todo';
import { useCustomModal } from '@/hooks/useCustomModal';
import useAuthStore from '@/store/useAuthStore'; // Import useAuthStore

// 신규 컴포넌트 임포트
import TodoCalendar from './components/TodoCalendar';
import TodoList from './components/TodoList';
import TodoDetail from './components/TodoDetail';
import { useHttp } from '@/util/axiosInstance';
import { getUserTagColor } from '@/util/userTagColors';

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
    const { userInfo } = useAuthStore(); // Get userInfo from useAuthStore
    const currentUserId = userInfo.userId; // Get current user's ID
    const [idChk, setIdCheck] = useState(false);
    const [isCompleted, setIsCompleted] = useState<any>();

    const fetchTodos = useCallback(async () => {
        try {
            const response = await get('/choiMath/todo/getTodoList', {
                params: {
                    userId: idChk ? currentUserId : '',
                    // startDate: currentDate.start,
                    // endDate: currentDate.end,
                    ...(isCompleted !== 'all' && { isCompleted: isCompleted })
                }
            });
            setTodos(response.data);
            const rTodo = response.data?.find((item) => item.id === selectedTodo?.id);
            if (rTodo) {
                setSelectedTodo(rTodo);
            }
        } catch (error) {
            showToast({ severity: 'error', summary: '조회 실패', detail: '목록을 불러오지 못했습니다.' });
        }
    }, [idChk, isCompleted]);

    const handleFetchCheck = (check) => {
        setIdCheck(check);
    };
    const handleSelect = (value) => {
        if (value === 'completed') setIsCompleted(true);
        if (value === 'pending') setIsCompleted(false);
        if (value === 'all') setIsCompleted('all');
    };

    useEffect(() => {
        fetchTodos();
    }, [idChk, isCompleted]);

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

    // 상세
    const handleDetail = async (todo) => {
        const result = await openModal({
            id: 'todoDetailModal',
            pData: {
                todo
            }
        });
        if (result) {
            fetchTodos();
        }
    };

    // 캘린다 내용 클릭
    const handleEventClick = (clickInfo: any) => {
        const todo = todos.find((t) => t.id === clickInfo.event.id);
        if (!todo) return;

        // 더블클릭시
        if (clickInfo.jsEvent.detail === 2) {
            handleDetail(todo);
        } else {
            // openDetailModal(todo);
            setSelectedTodo(todo);
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

    const events = useMemo(
        () =>
            todos.map((todo) => {
                let backgroundColor;
                if (todo.assignees.length === 1) {
                    // 한 명일 때는 해당 사용자의 색상 사용
                    backgroundColor = getUserTagColor(todo.assignees[0].userName);
                } else {
                    //기본 색상
                    backgroundColor = getUserTagColor('default');
                }

                // 완료 상태는 테두리 색상으로 표현
                let borderColor = backgroundColor;
                if (todo.isCompleted) {
                    backgroundColor = '#4caf50'; // 완료 시 초록색 테두리
                }

                return {
                    id: todo.id,
                    title: todo.isCompleted ? `[완료] ${todo.content}` : todo.content,
                    start: todo.date,
                    allDay: true,
                    backgroundColor: backgroundColor,
                    borderColor: borderColor,
                    textColor: '#ffffff',
                    extendedProps: {
                        description: todo.content,
                        assignees: todo?.assignees
                    }
                };
            }),
        [todos, currentUserId]
    );

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
                    onChangeCheck={(check) => handleFetchCheck(check)}
                    onStatusChange={(value) => handleSelect(value)}
                />

                <TodoList
                    todos={todos}
                    selectedTodo={selectedTodo}
                    onSelectionChange={setSelectedTodo}
                    onEdit={handleEdit}
                    onToggleComplete={handleToggleComplete}
                    currentUserId={currentUserId}
                    onRefresh={fetchTodos}
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
                /* 에디터가 내용에 따라 늘어나도록 내부 스크롤 방지 */
                .hide-toolbar .ql-container {
                    border: none !important;
                }
                .hide-toolbar .ql-editor {
                    overflow-y: visible !important;
                    height: auto !important;
                    padding: 0 !important;
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
                /* 내가 담당자로 지정된 할 일 */
                .my-assigned-todo-row {
                    background-color: var(--yellow-400); /* Light blue background */
                }
                .my-assigned-todo-row-completed {
                    background-color: #fa90ce; /* Light blue background */
                }
            `}</style>
        </div>
    );
};

export default AssistantTodoPage;
