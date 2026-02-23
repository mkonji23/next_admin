'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import {
    ATTENDANCE_STATUS_OPTIONS,
    HOMEWORK_PROGRESS_OPTIONS,
    LATE_TIME_OPTIONS,
    getAttendanceSeverity,
    getHomeworkSeverity
} from '@/constants/attendance';
import { debounce } from '@/util/debounce';

interface AttendanceStatusOption {
    label: string;
    value: string;
}

interface HomeworkProgressOption {
    label: string;
    value: number;
}

interface LateTimeOption {
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
    const lateTimeField = `day_${day}_lateTime`;

    const lateTimeOverlayRef = useRef<OverlayPanel>(null);

    // 로컬 상태로 즉각적인 UI 반응성 확보
    const [localAttendance, setLocalAttendance] = useState<string>((user[attendanceField] as string) || 'none');
    const [localHomework, setLocalHomework] = useState<number>((user[homeworkField] as number) || 0);
    const [localNote, setLocalNote] = useState<string>((user[noteField] as string) || '');
    const [localLateTime, setLocalLateTime] = useState<number | null>((user[lateTimeField] as number) || null);

    // 각 셀의 변경을 debounce하여 부모 상태 업데이트 최소화
    const debouncedAttendanceUpdate = useMemo(
        () =>
            debounce((value: string) => {
                onUpdate(user.id, attendanceField, value);
            }, 300),
        [user.id, attendanceField, onUpdate]
    );

    const debouncedHomeworkUpdate = useMemo(
        () =>
            debounce((value: number) => {
                onUpdate(user.id, homeworkField, value);
            }, 300),
        [user.id, homeworkField, onUpdate]
    );

    const debouncedNoteUpdate = useMemo(
        () =>
            debounce((value: string) => {
                onUpdate(user.id, noteField, value);
            }, 300),
        [user.id, noteField, onUpdate]
    );

    const debouncedLateTimeUpdate = useMemo(
        () =>
            debounce((value: number | null) => {
                onUpdate(user.id, lateTimeField, value);
            }, 300),
        [user.id, lateTimeField, onUpdate]
    );

    const handleAttendanceChange = useCallback(
        (value: string) => {
            setLocalAttendance(value); // 즉시 UI 업데이트
            debouncedAttendanceUpdate(value); // debounce된 부모 업데이트

            // 지각 선택 시 기본값 15분 설정
            if (value === 'late') {
                if (localLateTime === null) {
                    const defaultLateTime = 15; // 기본값 15분
                    setLocalLateTime(defaultLateTime);
                    debouncedLateTimeUpdate(defaultLateTime);
                }
            } else {
                // 지각이 아닐 때는 지각 시간 초기화
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

    const handleLateTimeChange = useCallback(
        (value: number | null) => {
            setLocalLateTime(value);
            debouncedLateTimeUpdate(value);
            // OverlayPanel 닫기
            if (lateTimeOverlayRef.current) {
                lateTimeOverlayRef.current.hide();
            }
        },
        [debouncedLateTimeUpdate]
    );

    // 선택된 지각 시간 레이블 가져오기
    const getLateTimeLabel = useCallback((minutes: number | null): string => {
        if (minutes === null) return '';
        const option = LATE_TIME_OPTIONS.find((opt) => opt.value === minutes);
        return option ? option.label : '';
    }, []);

    // 지각 시간에 따른 색상 반환
    const getLateTimeColor = useCallback((minutes: number | null): string => {
        if (minutes === null) return '#6c757d'; // 기본 회색

        // 시간에 따라 색상 결정
        if (minutes <= 15) {
            return '#28a745'; // 초록색 (15분 이하)
        } else if (minutes <= 30) {
            return '#ffc107'; // 노란색 (30분)
        } else if (minutes <= 60) {
            return '#fd7e14'; // 주황색 (1시간)
        } else if (minutes <= 120) {
            return '#dc3545'; // 빨간색 (2시간)
        } else {
            return '#c82333'; // 진한 빨간색 (3시간 이상)
        }
    }, []);

    const isLate = localAttendance === 'late';

    // user prop이 변경되면 로컬 상태 동기화
    useEffect(() => {
        const attendanceValue = (user[attendanceField] as string) || 'none';
        setLocalAttendance(attendanceValue);
        setLocalHomework((user[homeworkField] as number) || 0);
        setLocalNote((user[noteField] as string) || '');
        const lateTimeValue = user[lateTimeField];

        // 지각 상태이고 lateTime이 없으면 기본값 15분 설정
        if (attendanceValue === 'late') {
            if (typeof lateTimeValue === 'number') {
                setLocalLateTime(lateTimeValue);
            } else {
                // 기본값 15분 설정
                const defaultLateTime = 15;
                setLocalLateTime(defaultLateTime);
                debouncedLateTimeUpdate(defaultLateTime);
            }
        } else {
            setLocalLateTime(null);
        }
    }, [user, attendanceField, homeworkField, noteField, lateTimeField, debouncedLateTimeUpdate]);

    return (
        <div className="attendance-day-group" role="group" aria-label={`${day}일 출석 정보`}>
            <div className="attendance-cell" role="cell" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <Dropdown
                    value={localAttendance}
                    options={[...ATTENDANCE_STATUS_OPTIONS]}
                    onChange={(e: DropdownChangeEvent) => handleAttendanceChange(e.value)}
                    itemTemplate={(option: AttendanceStatusOption) => (
                        <Tag value={option.label} severity={getAttendanceSeverity(option.value) as any} />
                    )}
                    valueTemplate={(option: AttendanceStatusOption) => {
                        if (option) {
                            return <Tag value={option.label} severity={getAttendanceSeverity(option.value) as any} />;
                        }
                        return <span>선택</span>;
                    }}
                    style={{ width: isLate ? 'calc(100% - 10px)' : '100%' }}
                    appendTo={typeof window !== 'undefined' ? document.body : 'self'}
                    panelStyle={{ zIndex: 9999 }}
                    aria-label={`${day}일 출석 상태`}
                />
                {isLate && (
                    <>
                        <Button
                            icon="pi pi-clock"
                            className="p-button-text p-button-sm"
                            onClick={(e) => {
                                if (lateTimeOverlayRef.current) {
                                    lateTimeOverlayRef.current.toggle(e);
                                }
                            }}
                            style={{
                                padding: '4px',
                                minWidth: '12px',
                                width: '24px',
                                height: '24px',
                                color: getLateTimeColor(localLateTime)
                            }}
                            aria-label={`${day}일 지각 시간 선택`}
                            tooltip={localLateTime ? `${getLateTimeLabel(localLateTime)}` : '지각 시간 선택'}
                            tooltipOptions={{ position: 'top' }}
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
                                        style={{
                                            width: '100%',
                                            textAlign: 'left',
                                            justifyContent: 'flex-start'
                                        }}
                                    />
                                ))}
                            </div>
                        </OverlayPanel>
                    </>
                )}
            </div>
            <div className="attendance-cell" role="cell">
                <Dropdown
                    value={localHomework}
                    options={[...HOMEWORK_PROGRESS_OPTIONS]}
                    onChange={(e: DropdownChangeEvent) => handleHomeworkChange(e.value)}
                    itemTemplate={(option: HomeworkProgressOption) => (
                        <Tag value={option.label} severity={getHomeworkSeverity(option.value) as any} />
                    )}
                    valueTemplate={(option: HomeworkProgressOption | null) => {
                        if (option) {
                            return <Tag value={option.label} severity={getHomeworkSeverity(option.value) as any} />;
                        }
                        return <span>선택</span>;
                    }}
                    style={{ width: '100%' }}
                    appendTo={typeof window !== 'undefined' ? document.body : 'self'}
                    panelStyle={{ zIndex: 9999 }}
                    aria-label={`${day}일 숙제 진행률`}
                />
            </div>
            <div className="attendance-cell" role="cell">
                <InputText
                    value={localNote || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNoteChange(e.target?.value || '')}
                    placeholder=""
                    style={{ width: '100%' }}
                    aria-label={`${day}일 비고`}
                />
            </div>
        </div>
    );
});

AttendanceDayCells.displayName = 'AttendanceDayCells';

export default AttendanceDayCells;
