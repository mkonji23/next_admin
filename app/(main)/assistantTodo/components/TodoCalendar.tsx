import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Button } from 'primereact/button';

interface TodoCalendarProps {
    events: any[];
    onDateClick: (arg: any) => void;
    onEventClick: (clickInfo: any) => void;
    onEventChange: (changeInfo: any) => void;
    onDatesSet: (dateInfo: any) => void;
    onAddTodo: () => void;
}

const TodoCalendar: React.FC<TodoCalendarProps> = ({
    events,
    onDateClick,
    onEventClick,
    onEventChange,
    onDatesSet,
    onAddTodo
}) => {
    console.log('events', events);
    return (
        <div className="card">
            <div className="flex justify-content-between align-items-center mb-4">
                <h5 className="m-0">조교 할 일 목록 (캘린더)</h5>
                <Button label="신규 등록" icon="pi pi-plus" onClick={onAddTodo} />
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
