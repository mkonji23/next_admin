'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import confetti from 'canvas-confetti';
import {
    ATTENDANCE_STATUS_OPTIONS,
    HOMEWORK_PROGRESS_OPTIONS,
    LATE_TIME_OPTIONS,
    getAttendanceSeverity,
    getHomeworkSeverity
} from '@/constants/attendance';
import { debounce } from '@/util/debounce';

interface StatusOption {
    label: string;
    value: string;
}

interface NumericOption {
    label: string;
    value: number;
}

interface User {
    id: number;
    studentId?: string;
    name: string;
    grade?: string;
    school?: string;
    [key: string]: any;
}

interface AttendanceDayCellsProps {
    user: User;
    day: number;
    onUpdate: (userId: number, field: string, value: any) => void;
}

const AttendanceDayCells = React.memo<AttendanceDayCellsProps>(({ user, day, onUpdate }) => {
    const attendanceField = `day_${day}_attendance`;
    const homeworkField = `day_${day}_homework`;
    const noteField = `day_${day}_note`;
    const praiseField = `day_${day}_praise`;
    const lateTimeField = `day_${day}_lateTime`;
    const testScoreField = `day_${day}_testScore`;

    const lateTimeOverlayRef = useRef<OverlayPanel>(null);

    const [localAttendance, setLocalAttendance] = useState<string>((user[attendanceField] as string) || 'none');
    const [localHomework, setLocalHomework] = useState<number>((user[homeworkField] as number) || 0);
    const [localNote, setLocalNote] = useState<string>((user[noteField] as string) || '');
    const [localPraise, setLocalPraise] = useState<boolean>(!!user[praiseField]);
    const [localLateTime, setLocalLateTime] = useState<number | null>((user[lateTimeField] as number) || null);
    const [localTestScore, setLocalTestScore] = useState<number>((user[testScoreField] as number) || 0);

    const debouncedAttendanceUpdate = useMemo(() => debounce((value: any) => onUpdate(user.id, attendanceField, value), 300), [user.id, attendanceField, onUpdate]);
    const debouncedHomeworkUpdate = useMemo(() => debounce((value: any) => onUpdate(user.id, homeworkField, value), 300), [user.id, homeworkField, onUpdate]);
    const debouncedNoteUpdate = useMemo(() => debounce((value: any) => onUpdate(user.id, noteField, value), 300), [user.id, noteField, onUpdate]);
    const debouncedPraiseUpdate = useMemo(() => debounce((value: any) => onUpdate(user.id, praiseField, value), 300), [user.id, praiseField, onUpdate]);
    const debouncedLateTimeUpdate = useMemo(() => debounce((value: any) => onUpdate(user.id, lateTimeField, value), 300), [user.id, lateTimeField, onUpdate]);
    const debouncedTestScoreUpdate = useMemo(() => debounce((value: any) => onUpdate(user.id, testScoreField, value), 300), [user.id, testScoreField, onUpdate]);

    const handleAttendanceChange = useCallback(
        (value: string) => {
            setLocalAttendance(value);
            debouncedAttendanceUpdate(value);
            if (value === 'late' && localLateTime === null) {
                const defaultLateTime = 15;
                setLocalLateTime(defaultLateTime);
                debouncedLateTimeUpdate(defaultLateTime);
            } else if (value !== 'late') {
                setLocalLateTime(null);
                debouncedLateTimeUpdate(null);
            }
        },
        [debouncedAttendanceUpdate, debouncedLateTimeUpdate, localLateTime]
    );

    const handleHomeworkChange = useCallback(
        (value: number) => {
            setLocalHomework(value);
            debouncedHomeworkUpdate(value);
        },
        [debouncedHomeworkUpdate]
    );

    const handleNoteChange = useCallback(
        (value: string) => {
            setLocalNote(value);
            debouncedNoteUpdate(value);
        },
        [debouncedNoteUpdate]
    );

    const handlePraiseToggle = useCallback(() => {
        setLocalPraise((prev) => {
            const newValue = !prev;
            if (newValue) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            debouncedPraiseUpdate(newValue);
            return newValue;
        });
    }, [debouncedPraiseUpdate]);

    const handleLateTimeChange = useCallback(
        (value: number | null) => {
            setLocalLateTime(value);
            debouncedLateTimeUpdate(value);
            lateTimeOverlayRef.current?.hide();
        },
        [debouncedLateTimeUpdate]
    );

    const handleTestScoreChange = useCallback(
        (value: string) => {
            const score = parseInt(value, 10);
            const newScore = isNaN(score) ? 0 : score;
            setLocalTestScore(newScore);
            debouncedTestScoreUpdate(newScore);
        },
        [debouncedTestScoreUpdate]
    );

    const getLateTimeLabel = useCallback((minutes: number | null): string => {
        if (minutes === null) return '';
        return LATE_TIME_OPTIONS.find((opt) => opt.value === minutes)?.label || '';
    }, []);

    const getLateTimeColor = useCallback((minutes: number | null): string => {
        if (minutes === null) return '#6c757d';
        if (minutes <= 15) return '#28a745';
        if (minutes <= 30) return '#ffc107';
        if (minutes <= 60) return '#fd7e14';
        if (minutes <= 120) return '#dc3545';
        return '#c82333';
    }, []);

    const isLate = localAttendance === 'late';

    useEffect(() => {
        setLocalAttendance((user[attendanceField] as string) || 'none');
        setLocalHomework((user[homeworkField] as number) || 0);
        setLocalNote((user[noteField] as string) || '');
        setLocalPraise(!!user[praiseField]);
        setLocalTestScore((user[testScoreField] as number) || 0);
        setLocalLateTime((user[lateTimeField] as number) || null);
    }, [user, attendanceField, homeworkField, noteField, praiseField, testScoreField, lateTimeField]);

    return (
        <div className="attendance-day-group" role="group" aria-label={`${day}일 출석 정보`}>
            <div className="attendance-cell" role="cell" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <Dropdown
                    value={localAttendance}
                    options={[...ATTENDANCE_STATUS_OPTIONS]}
                    onChange={(e) => handleAttendanceChange(e.value)}
                    itemTemplate={(option: StatusOption) => (
                        <Tag value={option.label} severity={getAttendanceSeverity(option.value) as any} />
                    )}
                    valueTemplate={(option: StatusOption) =>
                        option ? (
                            <Tag value={option.label} severity={getAttendanceSeverity(option.value) as any} />
                        ) : (
                            <span>선택</span>
                        )
                    }
                    style={{ width: isLate ? 'calc(100% - 10px)' : '100%' }}
                    appendTo={typeof window !== 'undefined' ? document.body : 'self'}
                />
                {isLate && (
                    <>
                        <Button
                            icon="pi pi-clock"
                            className="p-button-text p-button-sm"
                            onClick={(e) => lateTimeOverlayRef.current?.toggle(e)}
                            style={{
                                padding: '4px',
                                minWidth: '12px',
                                width: '24px',
                                height: '24px',
                                color: getLateTimeColor(localLateTime)
                            }}
                            tooltip={localLateTime ? getLateTimeLabel(localLateTime) : '지각 시간 선택'}
                        />
                        <OverlayPanel ref={lateTimeOverlayRef} dismissable>
                            <div className="flex flex-column gap-2" style={{ minWidth: '150px' }}>
                                <div className="font-bold mb-2">지각 시간 선택</div>
                                {LATE_TIME_OPTIONS.map((option) => (
                                    <Button
                                        key={option.value}
                                        label={option.label}
                                        className={`p-button-text p-button-sm ${
                                            localLateTime === option.value ? 'p-button-secondary' : ''
                                        }`}
                                        onClick={() => handleLateTimeChange(option.value)}
                                    />
                                ))}
                            </div>
                        </OverlayPanel>
                    </>
                )}
            </div>
            <div className="attendance-cell" role="cell">
                <Dropdown
                    className="w-full"
                    value={localHomework}
                    options={[...HOMEWORK_PROGRESS_OPTIONS]}
                    onChange={(e) => handleHomeworkChange(e.value)}
                    itemTemplate={(option: NumericOption) => (
                        <Tag value={option.label} severity={getHomeworkSeverity(option.value) as any} />
                    )}
                    valueTemplate={(option: NumericOption | null) =>
                        option ? (
                            <Tag value={option.label} severity={getHomeworkSeverity(option.value) as any} />
                        ) : (
                            <span>선택</span>
                        )
                    }
                    appendTo={typeof window !== 'undefined' ? document.body : 'self'}
                />
            </div>
            <div className="attendance-cell praise-cell" role="cell">
                <Button
                    icon="pi pi-face-smile"
                    className={`${localPraise ? 'p-button-success' : 'p-button-secondary'}`}
                    onClick={handlePraiseToggle}
                    tooltip="칭찬하기"
                />
            </div>
            <div className="attendance-cell test-score-cell" role="cell">
                <InputText
                    className="w-full"
                    type="number"
                    value={localTestScore.toString()}
                    onChange={(e) => handleTestScoreChange(e.target.value)}
                    placeholder="점수"
                    style={{ textAlign: 'right' }}
                />
            </div>
            <div className="attendance-cell" role="cell">
                <InputText
                    className="w-full"
                    value={localNote || ''}
                    onChange={(e) => handleNoteChange(e.target.value)}
                    placeholder=""
                />
            </div>
        </div>
    );
});

AttendanceDayCells.displayName = 'AttendanceDayCells';
export default AttendanceDayCells;
