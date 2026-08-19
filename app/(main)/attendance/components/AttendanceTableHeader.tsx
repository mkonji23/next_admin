'use client';

import React from 'react';
import { Button } from 'primereact/button';
import { DAY_NAMES, HOLIDAYS } from '@/constants/attendance';
import { Tooltip } from 'primereact/tooltip';

export interface ColumnWidths {
    name: number;
    attendance: number;
    homework: number;
    praise: number;
    testScore: number;
    note: number;
    specialNote: number;
    [key: string]: number;
}

interface AttendanceTableHeaderProps {
    daysInMonth: number;
    year: number;
    month: number;
    totalStudents: number;
    fieldNames: { [key: string]: string };
    columnWidths?: ColumnWidths;
    onResizeColumn?: (fieldKey: string, newWidth: number) => void;
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
    },
    columnWidths,
    onResizeColumn
}) => {
    const monthStr: string = String(month + 1).padStart(2, '0');
    const dayHeaders: number[] = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const fieldKeys = Object.keys(fieldNames);

    const handleMouseDown = (e: React.MouseEvent, fieldKey: string) => {
        if (!onResizeColumn || !columnWidths) return;
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startWidth = columnWidths[fieldKey] || 100;

        const minWidths: Record<string, number> = {
            name: 100,
            attendance: 80,
            homework: 80,
            praise: 50,
            testScore: 50,
            note: 60,
            specialNote: 100
        };
        const minW = minWidths[fieldKey] || 50;

        const wrapper = document.querySelector('.attendance-table-wrapper') as HTMLElement | null;
        const tableEl = document.querySelector('.attendance-table') as HTMLElement | null;
        const initialScrollLeft = wrapper ? wrapper.scrollLeft : 0;

        const curAtt = columnWidths.attendance || 140;
        const curHw = columnWidths.homework || 120;
        const curPr = columnWidths.praise || 70;
        const curTs = columnWidths.testScore || 70;
        const curNt = columnWidths.note || 100;
        const curSp = columnWidths.specialNote || 240;

        const initialDayWidth = curAtt + curHw + curPr + curTs + curNt + curSp;
        let lastNewWidth = startWidth;

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const onMouseMove = (moveEvent: MouseEvent) => {
            moveEvent.preventDefault();
            const deltaX = moveEvent.clientX - startX;
            const newWidth = Math.max(minW, startWidth + deltaX);
            lastNewWidth = newWidth;

            if (tableEl) {
                tableEl.style.setProperty(`--col-${fieldKey}`, `${newWidth}px`);
            }

            if (wrapper && initialDayWidth > 0 && fieldKey !== 'name') {
                const widthDiff = newWidth - startWidth;
                const newDayWidth = initialDayWidth + widthDiff;
                const newScrollLeft = initialScrollLeft * (newDayWidth / initialDayWidth);
                wrapper.scrollLeft = newScrollLeft;
            }
        };

        const onMouseUp = () => {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);

            onResizeColumn(fieldKey, lastNewWidth);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    return (
        <div className="attendance-header" role="rowgroup">
            <Tooltip target=".note-tooltip-icon" position="top" />
            <div className="attendance-header-row" role="row">
                <div className="attendance-header-cell-name" role="columnheader">
                    <div className="flex justify-content-between align-items-center">
                        <span>이름</span>
                        <span>총 {totalStudents}명</span>
                    </div>
                    {onResizeColumn && (
                        <div
                            className="col-resizer"
                            onMouseDown={(e) => handleMouseDown(e, 'name')}
                            title="드래그하여 이름 열 너비 조절"
                        />
                    )}
                </div>
                {dayHeaders.map((day: number) => {
                    const dayStr: string = String(day).padStart(2, '0');
                    const currentDate: Date = new Date(year, month, day);
                    const dayOfWeek: number = currentDate.getDay();

                    let colorClass = '';
                    if (dayOfWeek === 0) {
                        colorClass = 'attendance-sun';
                    } else if (dayOfWeek === 6) {
                        colorClass = 'attendance-sat';
                    }

                    const headerText: string = `${monthStr}-${dayStr} (${DAY_NAMES[dayOfWeek]})`;
                    const borderStyle: React.CSSProperties = {
                        textAlign: 'center',
                        borderRight: day < daysInMonth ? '2px solid var(--primary-color)' : 'none'
                    };

                    return (
                        <div
                            key={`day_${day}`}
                            className={`attendance-header-day-group ${colorClass}`}
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
                                    ? '2px solid var(--primary-color)'
                                    : 'none'
                                : '1px solid var(--surface-border)',

                            color: fieldNames[fieldKey] === '비고' ? '#ff4d4f' : '',
                            position: 'relative'
                        };

                        const isNote = fieldNames[fieldKey] === '비고';

                        return (
                            <div
                                key={`sub_${fieldKey}_${day}`}
                                className="attendance-header-sub-cell"
                                role="columnheader"
                                style={subCellStyle}
                            >
                                <div className="flex align-items-center justify-content-center gap-1">
                                    {fieldNames[fieldKey]}
                                    {isNote && (
                                        <i
                                            className="note-tooltip-icon pi pi-exclamation-circle text-red-500 cursor-pointer"
                                            style={{ fontSize: '1.2rem' }}
                                            data-pr-tooltip="학생이 확인 가능한 필드입니다"
                                        ></i>
                                    )}
                                </div>
                                {onResizeColumn && (
                                    <div
                                        className="col-resizer"
                                        onMouseDown={(e) => handleMouseDown(e, fieldKey)}
                                        title={`드래그하여 ${fieldNames[fieldKey]} 열 너비 조절`}
                                    />
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default AttendanceTableHeader;
