import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';

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
