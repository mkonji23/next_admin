import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Tooltip } from 'primereact/tooltip';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';

interface TodoCalendarProps {
    events: any[];
    onDateClick: (arg: any) => void;
    onEventClick: (clickInfo: any) => void;
    onEventChange: (changeInfo: any) => void;
    onDatesSet: (dateInfo: any) => void;
    onAddTodo: () => void;
    onChangeCheck?: (check: boolean) => void;
    onStatusChange?: (status: string) => void; // 상태 변경 핸들러 추가
}

const TodoCalendar: React.FC<TodoCalendarProps> = ({
    events,
    onDateClick,
    onEventClick,
    onEventChange,
    onDatesSet,
    onAddTodo,
    onChangeCheck,
    onStatusChange
}) => {
    const [check, setCheck] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('all');

    const statusOptions = [
        { label: '전체', value: 'all' },
        { label: '완료', value: 'completed' },
        { label: '진행중', value: 'pending' }
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

    // 카드 헤더: 신규 등록 버튼만 배치
    const cardHeader = (
        <div className="flex align-items-center justify-content-between p-4 pb-0">
            <h5 className="m-0 font-bold text-xl text-900">업무 일정</h5>
            <Button
                label="신규 업무 등록"
                icon="pi pi-plus"
                severity="primary"
                onClick={onAddTodo}
                className="shadow-1"
            />
        </div>
    );

    return (
        <div className="todo-calendar-wrapper">
            {/* 1. 상단 필터 패널 (카드와 분리된 영역) */}
            <div className="surface-card p-3 mb-4 border-round-xl shadow-2 flex flex-column md:flex-row align-items-center justify-content-between gap-4">
                <div className="flex flex-wrap align-items-center gap-4">
                    {/* 1. 상태 필터 (SelectButton으로 변경 제안 - 더 직관적임) */}
                    <div className="flex align-items-center gap-3">
                        <span className="text-sm font-semibold text-900 surface-100 px-2 py-1 border-round">
                            업무 상태
                        </span>
                        <Dropdown
                            value={selectedStatus}
                            options={statusOptions}
                            onChange={handleStatusChange}
                            placeholder="상태 선택"
                            className="p-inputtext-sm w-full md:w-10rem border-none bg-bluegray-50 border-round-lg"
                        />
                    </div>

                    {/* 구분선 (데스크탑 전용) */}
                    <div className="hidden md:block border-left-1 surface-border h-2rem"></div>

                    {/* 2. 내 담당 업무 필터 (커스텀 스타일 체크박스) */}
                    <div className="flex align-items-center select-none group">
                        <Checkbox
                            inputId="myTaskOnly"
                            onChange={handleCheck}
                            checked={check}
                            className="p-checkbox-sm"
                        />
                        <label
                            htmlFor="myTaskOnly"
                            className={`ml-2 text-sm font-medium cursor-pointer transition-colors duration-200 ${
                                check ? 'text-blue-600' : 'text-600'
                            }`}
                        >
                            <i className="pi pi-user mr-1 text-xs" />내 담당업무
                        </label>
                    </div>
                </div>
            </div>

            {/* 2. 메인 캘린더 카드 */}
            <Card header={cardHeader} className="shadow-2 border-round-xl overflow-hidden">
                <Tooltip target=".todo-tooltip" position="top" appendTo="self" />

                <div className="calendar-container p-2">
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
                        datesSet={onDatesSet}
                        eventContent={(eventInfo) => {
                            const eventId = `event-${eventInfo.event.id}`;
                            const description = eventInfo.event.extendedProps?.description || '';
                            const assigneesList = eventInfo.event.extendedProps?.assignees || [];
                            const assigneesNames = assigneesList.map((item: any) => item.userName).join(', ');

                            const tooltipMsg = `${description.slice(0, 200)}${description.length > 200 ? '...' : ''}${
                                assigneesNames ? ` \r\n\r\n담당자: ${assigneesNames}` : ''
                            }`;

                            return (
                                <>
                                    <Tooltip target={`#${eventId}`} content={tooltipMsg} position="top" />
                                    <div
                                        id={eventId}
                                        className="w-full h-full p-1 border-round text-xs"
                                        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                    >
                                        {eventInfo.event.title}
                                    </div>
                                </>
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
            </Card>
        </div>
    );
};

export default TodoCalendar;
