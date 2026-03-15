'use client';

import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Button } from 'primereact/button';
import { useToast } from '@/hooks/useToast';
import { useCustomModal } from '@/hooks/useCustomModal';
import { Todo, TodoUser } from '@/types/todo';
import { useHttp } from '@/util/axiosInstance';
import { Tag } from 'primereact/tag';
import dayjs from 'dayjs';
import { useConfirm } from '@/hooks/useConfirm';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

const AssistantTodoPage = () => {
    const [events, setEvents] = useState<any[]>([]);
    const [todos, setTodos] = useState<Todo[]>([]);
    const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
    const { showToast } = useToast();
    const { openModal } = useCustomModal();
    const { showConfirm } = useConfirm();
    const http = useHttp();

    // Mapping todos to FullCalendar events
    const mapTodosToEvents = useCallback((todoList: Todo[]) => {
        return todoList.map((todo) => ({
            id: todo.id,
            title: `[${todo.assignees.map((item) => item.userName).join(', ')}] ${todo.content}`,
            start: todo.date,
            allDay: true,
            backgroundColor: todo.isCompleted ? '#4caf50' : '#2196f3',
            borderColor: todo.isCompleted ? '#4caf50' : '#2196f3',
            extendedProps: { ...todo }
        }));
    }, []);

    const fetchTodos = async (dateFrom?: string, dateTo?: string) => {
        try {
            const params = {
                dateFrom: dateFrom || dayjs().startOf('month').format('YYYY-MM-DD'),
                dateTo: dateTo || dayjs().endOf('month').format('YYYY-MM-DD')
            };
            const response = await http.get('/choiMath/todo/getTodoList', { params });
            setTodos(response.data);
        } catch (error) {
            console.error('Error fetching todos:', error);
            showToast({ severity: 'error', summary: '조회 실패', detail: '할 일 목록을 불러오는데 실패했습니다.' });
        }
    };

    const handleDatesSet = (dateInfo: any) => {
        const dateFrom = dayjs(dateInfo.start).format('YYYYMMDD');
        const dateTo = dayjs(dateInfo.start).endOf('month').format('YYYYMMDD');
        fetchTodos(dateFrom, dateTo);
    };

    useEffect(() => {
        setEvents(mapTodosToEvents(todos));
        if (selectedTodo) {
            const updated = todos.find((t) => t.id === selectedTodo.id);
            if (updated) setSelectedTodo(updated);
            else setSelectedTodo(null);
        }
    }, [todos, mapTodosToEvents]);

    const handleDateClick = async (arg: any) => {
        const result = await openModal({
            id: 'todo',
            pData: {
                mode: 'new',
                initialDate: arg.date
            }
        });

        if (result) {
            setTodos((prev) => [...prev, result]);
        }
    };

    const handleEventClick = (clickInfo: any) => {
        const todo = clickInfo.event.extendedProps as Todo;
        setSelectedTodo(todo);
    };

    const handleEventDoubleClick = async (todo: Todo) => {
        const result = await openModal({
            id: 'todo',
            pData: {
                mode: 'edit',
                todo: todo
            }
        });

        if (result) {
            setTodos((prev) => prev.map((t) => (t.id === result.id ? result : t)));
        }
    };

    const onEventClick = (clickInfo: any) => {
        if (clickInfo.jsEvent.detail === 2) {
            handleEventDoubleClick(clickInfo.event.extendedProps as Todo);
        } else {
            handleEventClick(clickInfo);
        }
    };

    const handleEventChange = async (changeInfo: any) => {
        const id = changeInfo.event.id;
        const newDate = dayjs(changeInfo.event.start).format('YYYY-MM-DD');

        try {
            await http.post('/choiMath/todo/updateTodoDate', { id, date: newDate });
            setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, date: newDate } : t)));
            showToast({ severity: 'success', summary: '날짜 변경', detail: '할 일의 날짜가 변경되었습니다.' });
        } catch (error) {
            changeInfo.revert();
            showToast({ severity: 'error', summary: '변경 실패', detail: '날짜 변경에 실패했습니다.' });
        }
    };

    const handleComplete = async (todo: Todo) => {
        try {
            const updated = { ...todo, isCompleted: true };
            await http.post('/choiMath/todo/updateTodo', updated);
            setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)));
            showToast({ severity: 'success', summary: '완료 처리', detail: '업무가 완료되었습니다.' });
        } catch (error) {
            showToast({ severity: 'error', summary: '처리 실패', detail: '완료 처리에 실패했습니다.' });
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await showConfirm({
            header: '삭제 확인',
            message: '이 할 일을 삭제하시겠습니까?',
            icon: 'pi pi-exclamation-triangle'
        });

        if (confirmed) {
            try {
                await http.post('/choiMath/todo/deleteTodo', { id });
                setTodos((prev) => prev.filter((t) => t.id !== id));
                setSelectedTodo(null);
                showToast({ severity: 'success', summary: '삭제 성공', detail: '할 일이 삭제되었습니다.' });
            } catch (error) {
                showToast({ severity: 'error', summary: '삭제 실패', detail: '삭제 중 오류가 발생했습니다.' });
            }
        }
    };

    const handleEdit = async (todo: Todo) => {
        await handleEventDoubleClick(todo);
    };

    const handleAddTodo = async () => {
        const result = await openModal({
            id: 'todo',
            pData: {
                mode: 'new',
                initialDate: new Date()
            }
        });

        if (result) {
            setTodos((prev) => [...prev, result]);
        }
    };

    return (
        <div className="grid">
            <div className="col-12 lg:col-8">
                <div className="card">
                    <div className="flex justify-content-between align-items-center mb-4">
                        <h5 className="m-0">조교 할 일 목록 (캘린더)</h5>
                        <Button label="신규 등록" icon="pi pi-plus" onClick={handleAddTodo} />
                    </div>

                    <div className="calendar-container">
                        <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,dayGridWeek'
                            }}
                            events={events}
                            dateClick={handleDateClick}
                            eventClick={onEventClick}
                            eventDrop={handleEventChange}
                            eventResize={handleEventChange}
                            datesSet={handleDatesSet}
                            locale="ko"
                            height="auto"
                            editable={true}
                            selectable={true}
                            selectMirror={true}
                            dayMaxEvents={true}
                        />
                    </div>
                </div>

                <div className="card mt-4">
                    <h5>할 일 목록 리스트</h5>
                    <DataTable
                        value={todos}
                        paginator
                        rows={10}
                        dataKey="id"
                        selectionMode="single"
                        selection={selectedTodo}
                        onSelectionChange={(e) => setSelectedTodo(e.value as Todo)}
                        emptyMessage="할 일이 없습니다."
                        responsiveLayout="scroll"
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
                            body={(rowData) => (
                                <div className="white-space-nowrap overflow-hidden text-overflow-ellipsis">
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
                        <Column field="workingHours" header="근무시간" style={{ width: '15%' }} />
                        <Column
                            field="isCompleted"
                            header="상태"
                            sortable
                            body={(rowData) => (
                                <Tag
                                    value={rowData.isCompleted ? '완료' : '진행 중'}
                                    severity={rowData.isCompleted ? 'success' : 'warning'}
                                />
                            )}
                            style={{ width: '10%' }}
                        />
                    </DataTable>
                </div>
            </div>

            <div className="col-12 lg:col-4">
                <div className="card h-full">
                    <div className="flex justify-content-between align-items-center mb-4">
                        <h5 className="m-0">업무 상세 내용</h5>
                        {selectedTodo && (
                            <div className="flex gap-2">
                                <Button
                                    icon="pi pi-pencil"
                                    className="p-button-rounded p-button-warning p-button-sm"
                                    onClick={() => handleEdit(selectedTodo)}
                                    tooltip="수정"
                                />
                                {!selectedTodo.isCompleted && (
                                    <Button
                                        icon="pi pi-check"
                                        className="p-button-rounded p-button-success p-button-sm"
                                        onClick={() => handleComplete(selectedTodo)}
                                        tooltip="완료 처리"
                                    />
                                )}
                                <Button
                                    icon="pi pi-trash"
                                    className="p-button-rounded p-button-danger p-button-sm"
                                    onClick={() => handleDelete(selectedTodo.id)}
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
                                    {selectedTodo.assignees.map((item, idx) => (
                                        <span key={idx} className="p-tag p-tag-info">
                                            {item.userName}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="block text-900 font-bold mb-1">근무시간</label>
                                <div className="text-700">{selectedTodo.workingHours || '-'}</div>
                            </div>
                            <div className="mb-3">
                                <label className="block text-900 font-bold mb-1">업무 내용</label>
                                <div className="text-700 white-space-pre-wrap">{selectedTodo.content}</div>
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
            </div>

            <style jsx global>{`
                .fc .fc-button-primary {
                    background-color: var(--primary-color);
                    border-color: var(--primary-color);
                    transition: opacity 0.2s ease;
                }
                .fc .fc-button-primary:hover {
                    background-color: var(--primary-color) !important;
                    border-color: var(--primary-color) !important;
                    opacity: 0.6;
                    filter: blur(0.5px);
                }
                .fc .fc-button-primary:disabled {
                    background-color: var(--primary-color);
                    border-color: var(--primary-color);
                    opacity: 0.65;
                }
                .fc .fc-button-active {
                    background-color: var(--primary-color-hover) !important;
                    border-color: var(--primary-color-hover) !important;
                }
                /* 토요일/일요일 빨간색 처리 */
                .fc-day-sun .fc-col-header-cell-cushion,
                .fc-day-sun .fc-daygrid-day-number {
                    color: #e91e63 !important; /* 일요일 빨간색 */
                }
                .fc-day-sat .fc-col-header-cell-cushion,
                .fc-day-sat .fc-daygrid-day-number {
                    color: #ff5252 !important;
                }
                .fc-event {
                    cursor: pointer;
                    padding: 2px 4px;
                    border-radius: 4px;
                }
                .fc-daygrid-event-dot {
                    display: none;
                }
            `}</style>
        </div>
    );
};

export default AssistantTodoPage;
