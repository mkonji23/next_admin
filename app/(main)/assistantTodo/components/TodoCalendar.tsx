import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Tooltip } from 'primereact/tooltip';

interface TodoCalendarProps {
    events: any[];
    onDateClick: (arg: any) => void;
    onEventClick: (clickInfo: any) => void;
    onEventChange: (changeInfo: any) => void;
    onDatesSet: (dateInfo: any) => void;
    onAddTodo: () => void;
    // 내꺼만보기
    onChangeCheck?: (check: boolean) => void;
}

const TodoCalendar: React.FC<TodoCalendarProps> = ({
    events,
    onDateClick,
    onEventClick,
    onEventChange,
    onDatesSet,
    onAddTodo,
    onChangeCheck
}) => {
    const [check, setCheck] = useState(false);
    const handleCheck = (e) => {
        setCheck(!check);
        onChangeCheck && onChangeCheck(!check);
    };
    return (
        <div className="card">
            <Tooltip target=".todo-tooltip" position="top" appendTo="self" />
            <div className="flex justify-content-between align-items-center mb-4">
                {/* 왼쪽: 제목 */}
                <h5 className="m-0">조교쌤 일자별 업무(캘린더)</h5>

                {/* 오른쪽 그룹: 체크박스와 버튼을 하나의 flex로 묶음 */}
                <div className="flex align-items-center gap-3">
                    <div className="flex align-items-center">
                        <Checkbox inputId="ingredient2" onChange={handleCheck} checked={check} />
                        <label htmlFor="ingredient2" className="ml-2 cursor-pointer">
                            내 담당업무만 보기
                        </label>
                    </div>

                    <Button label="신규 등록" icon="pi pi-plus" onClick={onAddTodo} />
                </div>
            </div>

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
                    datesSet={onDatesSet}
                    eventContent={(eventInfo) => {
                        const eventId = `event-${eventInfo.event.id}`; // 고유 ID 생성
                        const description = eventInfo.event.extendedProps?.description || '';
                        // Safety 처리: 데이터가 없을 경우 빈 값 처리
                        const assigneesList = eventInfo.event.extendedProps?.assignees || [];
                        const assigneesNames = assigneesList.map((item: any) => item.userName).join(', ');

                        const truncate1 = (str: string, n: number) => {
                            return str.length > n ? str.slice(0, n) + '...' : str;
                        };

                        // 툴팁에 표시될 문자열
                        const tooltipMsg = `${truncate1(description, 200)}${
                            assigneesNames ? ` \r\n\r\n담당자: ${assigneesNames}` : ''
                        }`;
                        return (
                            <>
                                {/* 개별 이벤트마다 전용 툴팁 타겟 지정 */}
                                <Tooltip target={`#${eventId}`} content={tooltipMsg} position="top" />
                                <div
                                    id={eventId}
                                    className="w-full h-full p-1"
                                    style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
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
        </div>
    );
};

export default TodoCalendar;
