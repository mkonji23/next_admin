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
    totalQuestions?: number;
}

const AttendanceDayCells = React.memo<AttendanceDayCellsProps>(({ user, day, onUpdate, totalQuestions = 0 }) => {
    const attendanceField = `day_${day}_attendance`;
    const homeworkField = `day_${day}_homework`;
    const noteField = `day_${day}_note`;
    const reinforceField = `day_${day}_reinforce`;
    const specialNoteField = `specialNote`;
    const praiseField = `day_${day}_praise`;
    const lateTimeField = `day_${day}_lateTime`;
    const testScoreField = `day_${day}_testScore`;

    const lateTimeOverlayRef = useRef<OverlayPanel>(null);

    const [localAttendance, setLocalAttendance] = useState<string>((user[attendanceField] as string) || 'none');
    const [localHomework, setLocalHomework] = useState<number>((user[homeworkField] as number) || 0);
    const [localNote, setLocalNote] = useState<string>((user[noteField] as string) || '');
    const [localReinforce, setLocalReinforce] = useState<string>((user[reinforceField] as string) || '');
    const [localSpecialNote, setLocalSpecialNote] = useState<string>((user[specialNoteField] as string) || '');
    const [localPraise, setLocalPraise] = useState<boolean>(!!user[praiseField]);
    const [localLateTime, setLocalLateTime] = useState<number | null>((user[lateTimeField] as number) || null);
    const [localTestScore, setLocalTestScore] = useState<number>((user[testScoreField] as number) || 0);

    const debouncedAttendanceUpdate = useMemo(
        () => debounce((value: any) => onUpdate(user.id, attendanceField, value), 300),
        [user.id, attendanceField, onUpdate]
    );
    const debouncedHomeworkUpdate = useMemo(
        () => debounce((value: any) => onUpdate(user.id, homeworkField, value), 300),
        [user.id, homeworkField, onUpdate]
    );
    const debouncedNoteUpdate = useMemo(
        () => debounce((value: any) => onUpdate(user.id, noteField, value), 300),
        [user.id, noteField, onUpdate]
    );
    const debouncedReinforceUpdate = useMemo(
        () => debounce((value: any) => onUpdate(user.id, reinforceField, value), 300),
        [user.id, reinforceField, onUpdate]
    );
    const debouncedSpecialNoteUpdate = useMemo(
        () => debounce((value: any) => onUpdate(user.id, specialNoteField, value), 300),
        [user.id, specialNoteField, onUpdate]
    );
    const debouncedPraiseUpdate = useMemo(
        () => debounce((value: any) => onUpdate(user.id, praiseField, value), 300),
        [user.id, praiseField, onUpdate]
    );
    const debouncedLateTimeUpdate = useMemo(
        () => debounce((value: any) => onUpdate(user.id, lateTimeField, value), 300),
        [user.id, lateTimeField, onUpdate]
    );
    const debouncedTestScoreUpdate = useMemo(
        () => debounce((value: any) => onUpdate(user.id, testScoreField, value), 300),
        [user.id, testScoreField, onUpdate]
    );

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

    const handleReinforceChange = useCallback(
        (value: string) => {
            setLocalReinforce(value);
            debouncedReinforceUpdate(value);
        },
        [debouncedReinforceUpdate]
    );

    const handleReinforceBlur = useCallback(() => {
        debouncedReinforceUpdate.cancel?.();
        onUpdate(user.id, reinforceField, localReinforce);
    }, [user.id, reinforceField, localReinforce, onUpdate, debouncedReinforceUpdate]);

    const handleNoteBlur = useCallback(() => {
        debouncedNoteUpdate.cancel?.();
        onUpdate(user.id, noteField, localNote);
    }, [user.id, noteField, localNote, onUpdate, debouncedNoteUpdate]);

    const handleSpecialNoteBlur = useCallback(() => {
        debouncedSpecialNoteUpdate.cancel?.();
        onUpdate(user.id, specialNoteField, localSpecialNote);
    }, [user.id, specialNoteField, localSpecialNote, onUpdate, debouncedSpecialNoteUpdate]);

    const handleTestScoreBlur = useCallback(() => {
        debouncedTestScoreUpdate.cancel?.();
        onUpdate(user.id, testScoreField, localTestScore);
    }, [user.id, testScoreField, localTestScore, onUpdate, debouncedTestScoreUpdate]);

    useEffect(() => {
        return () => {
            debouncedReinforceUpdate.cancel?.();
            debouncedNoteUpdate.cancel?.();
            debouncedSpecialNoteUpdate.cancel?.();
            debouncedTestScoreUpdate.cancel?.();
        };
    }, [debouncedReinforceUpdate, debouncedNoteUpdate, debouncedSpecialNoteUpdate, debouncedTestScoreUpdate]);

    const handleSpecialNoteChange = useCallback(
        (value: string) => {
            setLocalSpecialNote(value);
            debouncedSpecialNoteUpdate(value);
        },
        [debouncedSpecialNoteUpdate]
    );
    const fire = (particleRatio, opts) => {
        confetti({
            ...opts,
            origin: { y: 0.7 },
            particleCount: Math.floor(200 * particleRatio)
        });
    };

    const fullscreenConfetti = () => {
        // 왼쪽에서 발사
        fire(0.25, { spread: 26, startVelocity: 55, origin: { x: 0 } });
        // 오른쪽에서 발사
        fire(0.25, { spread: 26, startVelocity: 55, origin: { x: 1 } });
        // 중앙에서 화려하게
        fire(0.2, { spread: 60 });
    };

    const handlePraiseToggle = useCallback(() => {
        setLocalPraise((prev) => {
            const newValue = !prev;
            if (newValue) fullscreenConfetti();
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

    const userAttendance = (user[attendanceField] as string) || 'none';
    const userHomework = (user[homeworkField] as number) || 0;
    const userNote = (user[noteField] as string) || '';
    const userReinforce = (user[reinforceField] as string) || '';
    const userSpecialNote = (user[specialNoteField] as string) || '';
    const userPraise = !!user[praiseField];
    const userTestScore = (user[testScoreField] as number) || 0;
    const userLateTime = (user[lateTimeField] as number) || null;

    useEffect(() => {
        setLocalAttendance(userAttendance);
    }, [user.id, userAttendance]);

    useEffect(() => {
        setLocalHomework(userHomework);
    }, [user.id, userHomework]);

    useEffect(() => {
        setLocalNote(userNote);
    }, [user.id, userNote]);

    useEffect(() => {
        setLocalReinforce(userReinforce);
    }, [user.id, userReinforce]);

    useEffect(() => {
        setLocalSpecialNote(userSpecialNote);
    }, [user.id, userSpecialNote]);

    useEffect(() => {
        setLocalPraise(userPraise);
    }, [user.id, userPraise]);

    useEffect(() => {
        setLocalTestScore(userTestScore);
    }, [user.id, userTestScore]);

    useEffect(() => {
        setLocalLateTime(userLateTime);
    }, [user.id, userLateTime]);

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
                />
            </div>
            <div className="attendance-cell test-score-cell" role="cell" style={{ flexDirection: 'column', padding: '2px', gap: '1px' }}>
                <InputText
                    className="w-full"
                    type="number"
                    value={localTestScore.toString()}
                    onChange={(e) => handleTestScoreChange(e.target.value)}
                    onBlur={handleTestScoreBlur}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            (e.target as HTMLElement).blur();
                        }
                    }}
                    placeholder="맞은수"
                    style={{ textAlign: 'center', fontSize: '0.8rem', padding: '2px 4px' }}
                />
                {totalQuestions > 0 && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-color-secondary)', textAlign: 'center', lineHeight: '1' }}>
                        / {totalQuestions}
                    </span>
                )}
            </div>
            <div className="attendance-cell" role="cell">
                <InputText
                    className="w-full"
                    value={localNote || ''}
                    onChange={(e) => handleNoteChange(e.target.value)}
                    onBlur={handleNoteBlur}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            (e.target as HTMLElement).blur();
                        }
                    }}
                    placeholder=""
                    title={localNote || ''}
                />
            </div>
            <div className="attendance-cell" role="cell">
                <InputText
                    className="w-full"
                    value={localReinforce || ''}
                    onChange={(e) => handleReinforceChange(e.target.value)}
                    onBlur={handleReinforceBlur}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            (e.target as HTMLElement).blur();
                        }
                    }}
                    placeholder=""
                    title={localReinforce || ''}
                    aria-label={`${user.name} ${day}일 클/보`}
                />
            </div>
            <div className="attendance-cell" role="cell">
                <InputText
                    className="w-full"
                    value={localSpecialNote || ''}
                    onChange={(e) => handleSpecialNoteChange(e.target.value)}
                    onBlur={handleSpecialNoteBlur}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            (e.target as HTMLElement).blur();
                        }
                    }}
                    placeholder=""
                    title={localSpecialNote || ''}
                />
            </div>
        </div>
    );
});

AttendanceDayCells.displayName = 'AttendanceDayCells';
export default AttendanceDayCells;
