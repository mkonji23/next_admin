'use client';

import React from 'react';
import { DAY_NAMES, HOLIDAYS } from '@/constants/attendance';

interface AttendanceTableHeaderProps {
    daysInMonth: number;
    year: number;
    month: number;
    totalStudents: number;
    fieldNames: { [key: string]: string };
}

const AttendanceTableHeader: React.FC<AttendanceTableHeaderProps> = ({
    daysInMonth,
    year,
    month,
    totalStudents,
    fieldNames = {
        attendance: '출석',
        homework: '숙제',
        praise: '칭찬',
        testScore: '점수',
        note: '비고'
    }
}) => {
    const monthStr: string = String(month + 1).padStart(2, '0');
    const dayHeaders: number[] = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const fieldKeys = Object.keys(fieldNames);

    return (
        <div className="attendance-header" role="rowgroup">
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
            <div className="attendance-header-row" role="row">
                {dayHeaders.flatMap((day: number) =>
                    fieldKeys.map((fieldKey, index) => {
                        const isLastSubCell = index === fieldKeys.length - 1;

                        const subCellStyle: React.CSSProperties = {
                            borderRight: isLastSubCell
                                ? day < daysInMonth
                                    ? '2px solid #007ad9'
                                    : 'none'
                                : '1px solid #dee2e6'
                        };

                        // Note: Width is now controlled by the grid-template-columns in page.tsx
                        // No inline style for width is needed here anymore, but keeping it won't hurt
                        // as grid template takes precedence.

                        return (
                            <div
                                key={`sub_${fieldKey}_${day}`}
                                className="attendance-header-sub-cell"
                                role="columnheader"
                                style={subCellStyle}
                            >
                                {fieldNames[fieldKey]}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default AttendanceTableHeader;
