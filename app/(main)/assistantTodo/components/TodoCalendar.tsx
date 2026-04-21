'use client';

import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Tooltip } from 'primereact/tooltip';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { SelectButton } from 'primereact/selectbutton';
import { Todo, TodoStatus } from '@/types/todo';
import KanbanBoard from './KanbanBoard';

interface TodoCalendarProps {
    todos: Todo[];
    events: any[];
    onDateClick: (arg: any) => void;
    onEventClick: (clickInfo: any) => void;
    onEventChange: (changeInfo: any) => void;
    onDatesSet: (dateInfo: any) => void;
    onAddTodo: () => void;
    onEdit: (todo: Todo) => void;
    onDetail: (todo: Todo) => void;
    onChangeCheck?: (check: boolean) => void;
    onStatusChange?: (status: string) => void;
    onTodoStatusChange: (todo: Todo, status: TodoStatus) => void;
    viewMode: 'calendar' | 'kanban';
    onViewModeChange: (mode: 'calendar' | 'kanban') => void;
}

const TodoCalendar: React.FC<TodoCalendarProps> = ({
    todos,
    events,
    onDateClick,
    onEventClick,
    onEventChange,
    onDatesSet,
    onAddTodo,
    onEdit,
    onDetail,
    onChangeCheck,
    onStatusChange,
    onTodoStatusChange,
    viewMode,
    onViewModeChange
}) => {
    const [check, setCheck] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState('all');

    const statusOptions = [
        { label: '전체', value: 'all' },
        { label: '대기', value: 'PENDING' },
        { label: '진행', value: 'IN_PROGRESS' },
        { label: '보류', value: 'HOLD' },
        { label: '완료', value: 'COMPLETED' }
    ];

    const viewModeOptions = [
        { label: '캘린더', value: 'calendar', icon: 'pi pi-calendar' },
        { label: '칸반보드', value: 'kanban', icon: 'pi pi-th-large' }
    ];

    const handleCheck = () => {
        const newCheck = !check;
        setCheck(newCheck);
        onChangeCheck && onChangeCheck(newCheck);
    };

    const handleStatusChange = (e: any) => {
        setSelectedStatus(e.value);
        onStatusChange && onStatusChange(e.value);
    };

    const cardHeader = (
        <div className="flex flex-column md:flex-row align-items-center justify-content-between p-4 pb-2 gap-3">
            <h5 className="m-0 font-bold text-xl text-900 flex align-items-center gap-2">
                <i className="pi pi-calendar-plus text-primary text-2xl"></i>
                업무일정 및 보드
            </h5>
            <div className="flex align-items-center gap-2">
                <SelectButton
                    value={viewMode}
                    options={viewModeOptions}
                    onChange={(e) => e.value && onViewModeChange(e.value)}
                    itemTemplate={(option) => (
                        <div className="flex align-items-center gap-2 px-1">
                            <i className={option.icon}></i>
                            <span>{option.label}</span>
                        </div>
                    )}
                    className="p-button-sm"
                />
                <Button label="신규 등록" icon="pi pi-plus" onClick={onAddTodo} className="shadow-1 p-button-sm" />
            </div>
        </div>
    );

    return (
        <div className="todo-calendar-wrapper">
            <Tooltip
                target=".todo-tooltip"
                position="top"
                appendTo={typeof document !== 'undefined' ? document.body : 'self'}
                style={{ whiteSpace: 'pre-wrap', maxWidth: '300px' }}
            />
            <div className="surface-card p-3 mb-4 border-round-xl shadow-1 flex flex-column md:flex-row align-items-center justify-content-between gap-4">
                <div className="flex flex-wrap align-items-center gap-4">
                    <div className="flex align-items-center gap-3">
                        <span className="text-sm font-semibold text-900 surface-100 px-2 py-1 border-round">
                            상태 필터
                        </span>
                        <Dropdown
                            value={selectedStatus}
                            options={statusOptions}
                            onChange={handleStatusChange}
                            placeholder="상태 선택"
                            className="p-inputtext-sm"
                        />
                    </div>

                    <div className="hidden md:block border-left-1 surface-border h-2rem"></div>

                    <div className="flex align-items-center select-none">
                        <Checkbox
                            inputId="myTaskOnly"
                            onChange={handleCheck}
                            checked={check}
                            className="p-checkbox-sm"
                        />
                        <label
                            htmlFor="myTaskOnly"
                            className={`ml-2 text-sm font-medium cursor-pointer transition-colors duration-200 ${
                                check ? 'text-blue-600 font-bold' : 'text-600'
                            }`}
                        >
                            <i className="pi pi-user mr-1 text-xs" />내 담당업무만
                        </label>
                    </div>
                </div>
            </div>

            <Card header={cardHeader} className="shadow-2 border-round-xl overflow-hidden mb-4">
                <div className="p-2">
                    {viewMode === 'calendar' ? (
                        <div className="calendar-container">
                            <FullCalendar
                                plugins={[dayGridPlugin, interactionPlugin]}
                                initialView="dayGridWeek"
                                headerToolbar={{
                                    left: 'prev,next today',
                                    center: 'title',
                                    right: 'dayGridMonth,dayGridWeek'
                                }}
                                buttonText={{
                                    today: '오늘',
                                    dayGridMonth: '월',
                                    dayGridWeek: '주간'
                                }}
                                events={events}
                                dateClick={onDateClick}
                                eventClick={onEventClick}
                                eventDrop={onEventChange}
                                eventResize={onEventChange}
                                eventContent={(eventInfo) => {
                                    const description = eventInfo.event.extendedProps?.description || '';
                                    const assigneesList = eventInfo.event.extendedProps?.assignees || [];
                                    const assigneesNames = assigneesList.map((item: any) => item.userName).join(', ');

                                    const tooltipMsg = `${description.slice(0, 200)}${
                                        description.length > 200 ? '...' : ''
                                    }${assigneesNames ? ` \r\n\r\n담당자: ${assigneesNames}` : ''}`;

                                    return (
                                        <div
                                            className="w-full h-full p-1 border-round text-xs todo-tooltip"
                                            data-pr-tooltip={tooltipMsg}
                                            style={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {eventInfo.event?.extendedProps?.title || tooltipMsg}
                                        </div>
                                    );
                                }}
                                locale="ko"
                                height="auto"
                                editable={true}
                                selectable={true}
                                selectMirror={true}
                                dayMaxEvents={true}
                            />
                        </div>
                    ) : (
                        <div className="kanban-view-container">
                            <KanbanBoard
                                todos={todos}
                                onEdit={onEdit}
                                onDetail={onDetail}
                                onStatusChange={onTodoStatusChange}
                            />
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default TodoCalendar;
