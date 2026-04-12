'use client';

import React from 'react';
import { Button } from 'primereact/button';
import AttendanceDayCells from './AttendanceDayCells';

interface User {
    id: number;
    studentId?: string;
    name: string;
    grade?: string;
    school?: string;
    specialNote?: string;
    [key: string]: any;
}

interface AttendanceRowProps {
    user: User;
    daysInMonth: number;
    onUpdate: (userId: number, field: string, value: any) => void;
}

const AttendanceRow = React.memo<AttendanceRowProps>(
    ({ user, daysInMonth, onUpdate }) => {
        return (
            <div className="attendance-row" role="row">
                <div className="attendance-cell-name" role="cell" aria-label="학생 이름">
                    <div className="flex align-items-center justify-content-between w-full h-full">
                        <span className="font-bold white-space-nowrap overflow-hidden text-overflow-ellipsis">
                            {user.name}
                        </span>
                        <div className="flex gap-1 ml-2">
                            {user.description && (
                                <Button
                                    icon="pi pi-info-circle"
                                    className="p-button-rounded p-button-text p-button-info"
                                    style={{ width: '24px', height: '24px', padding: 0 }}
                                    tooltip={user.description}
                                    tooltipOptions={{ position: 'top', showDelay: 100 }}
                                />
                            )}
                            <Button
                                icon="pi pi-id-card"
                                className="p-button-rounded p-button-text p-button-secondary"
                                style={{ width: '24px', height: '24px', padding: 0 }}
                                tooltip={`${user.school || '학교 미지정'} / ${user.grade || '학년 미지정'}`}
                                tooltipOptions={{ position: 'top', showDelay: 100 }}
                            />
                        </div>
                    </div>
                </div>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
                    <AttendanceDayCells key={day} user={user} day={day} onUpdate={onUpdate} />
                ))}
            </div>
        );
    },
    (prevProps, nextProps) => {
        // 커스텀 비교 함수: user 객체의 특정 필드만 비교
        if (prevProps.user.id !== nextProps.user.id) {
            return false;
        }
        if (prevProps.daysInMonth !== nextProps.daysInMonth) {
            return false;
        }
        // user 객체의 모든 동적 필드 비교
        const prevKeys = Object.keys(prevProps.user);
        const nextKeys = Object.keys(nextProps.user);
        if (prevKeys.length !== nextKeys.length) {
            return false;
        }
        for (const key of prevKeys) {
            if (prevProps.user[key] !== nextProps.user[key]) {
                return false;
            }
        }
        return true;
    }
);

AttendanceRow.displayName = 'AttendanceRow';

export default AttendanceRow;
