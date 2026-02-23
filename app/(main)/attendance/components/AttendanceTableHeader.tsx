'use client';

import React from 'react';
import { DAY_NAMES, HOLIDAYS } from '@/constants/attendance';

interface AttendanceTableHeaderProps {
    daysInMonth: number;
    year: number;
    month: number;
    totalStudents: number;
}

const AttendanceTableHeader: React.FC<AttendanceTableHeaderProps> = ({
    daysInMonth,
    year,
    month,
    totalStudents
}) => {
    const monthStr: string = String(month + 1).padStart(2, '0');
    const dayHeaders: number[] = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
        <div className="attendance-header" role="rowgroup">
            {/* 첫 번째 헤더 행 */}
            <div className="attendance-header-row" role="row">
                <div className="attendance-header-cell-name" role="columnheader">
                    <div className="flex justify-content-between align-items-center">
                        <span>이름</span>
                        <span>총 {totalStudents}명</span>
                    </div>
                </div>
                {dayHeaders.map((day: number) => {
                    const dayStr: string = String(day).padStart(2, '0');
                    const currentDate: Date = new Date(year, month, day);
                    const dayOfWeek: number = currentDate.getDay();
                    const dateStr: string = `${year}-${monthStr}-${dayStr}`;

                    const style: React.CSSProperties = { textAlign: 'center' };
                    if (dayOfWeek === 0 || HOLIDAYS.includes(dateStr)) {
                        style.color = 'red';
                    } else if (dayOfWeek === 6) {
                        style.color = 'blue';
                    }

                    const headerText: string = `${monthStr}-${dayStr} (${DAY_NAMES[dayOfWeek]})`;
                    const borderStyle: React.CSSProperties = {
                        ...style,
                        borderRight: day < daysInMonth ? '2px solid #007ad9' : 'none'
                    };

                    return (
                        <div
                            key={`day_${day}`}
                            className="attendance-header-day-group"
                            role="columnheader"
                            style={borderStyle}
                        >
                            {headerText}
                        </div>
                    );
                })}
            </div>
            {/* 두 번째 헤더 행 */}
            <div className="attendance-header-row" role="row">
                {dayHeaders.flatMap((day: number) => [
                    <div
                        key={`sub_att_${day}`}
                        className="attendance-header-sub-cell"
                        role="columnheader"
                        style={{ borderRight: '1px solid #dee2e6' }}
                    >
                        출석
                    </div>,
                    <div
                        key={`sub_hw_${day}`}
                        className="attendance-header-sub-cell"
                        role="columnheader"
                        style={{ borderRight: '1px solid #dee2e6' }}
                    >
                        숙제
                    </div>,
                    <div
                        key={`sub_note_${day}`}
                        className="attendance-header-sub-cell"
                        role="columnheader"
                        style={{
                            borderRight: day < daysInMonth ? '2px solid #007ad9' : 'none'
                        }}
                    >
                        비고
                    </div>
                ])}
            </div>
        </div>
    );
};

export default AttendanceTableHeader;
