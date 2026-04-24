'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Calendar } from 'primereact/calendar';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { OverlayPanel } from 'primereact/overlaypanel';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';
import { Class } from '@/types/class';
import { useVirtualizer } from '@tanstack/react-virtual';
import dayjs from 'dayjs';
import AttendanceRow from './components/AttendanceRow';
import AttendanceTableHeader from './components/AttendanceTableHeader';
import { useCustomModal } from '@/hooks/useCustomModal';

export interface ClassOption {
    label: string;
    value: string;
    classId: string;
}

interface User {
    id: number;
    studentId?: string;
    name: string;
    grade?: string;
    school?: string;
    [key: string]: any;
}

const VIRTUAL_SCROLL_THRESHOLD = 50;

const AttendancePage = () => {
    const { showConfirm } = useConfirm();
    const [date, setDate] = useState<Date | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [selectedScrollDate, setSelectedScrollDate] = useState<Date | null>(null);
    const http = useHttp();
    const { showToast } = useToast();
    const tableWrapperRef = useRef<HTMLDivElement>(null);
    const tableBodyRef = useRef<HTMLDivElement>(null);
    const scrolled = useRef<boolean>(false);
    const datePickerOverlayRef = useRef<OverlayPanel>(null);

    useEffect(() => {
        setDate(new Date());
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await http.get('/choiMath/class/');
            const classOptions: ClassOption[] = (response.data || []).map((cls: Class) => ({
                label: cls.className,
                value: cls.classId,
                classId: cls.classId
            }));
            setClasses(classOptions);
        } catch (error) {
            console.error('Error fetching classes:', error);
            showToast({ severity: 'error', summary: '조회 실패', detail: '클래스 목록을 불러오는데 실패했습니다.' });
        }
    };

    const processAttendanceData = useCallback(
        (attendanceData: any) => {
            if (!attendanceData || !date) {
                setUsers([]);
                return;
            }

            console.log('attendanceData', attendanceData);

            const year = date.getFullYear();
            const month = date.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            const attendanceUsers: User[] = (attendanceData.students || []).map((student: any, index: number) => {
                const userData: User = {
                    ...student,
                    id: index + 1,
                    studentId: student.studentId,
                    name: student.name || '이름 없음',
                    grade: student.grade || '',
                    school: student.school || '',
                    specialNote: student.specialNote || ''
                };

                for (let i = 1; i <= daysInMonth; i++) {
                    const dayKey = i.toString();
                    const dayData = student.attendance?.[dayKey];
                    userData[`day_${i}_attendance`] = dayData?.status || 'none';
                    userData[`day_${i}_homework`] = dayData?.homework || 0;
                    userData[`day_${i}_note`] = dayData?.note || '';
                    userData[`specialNote`] = student?.specialNote || '';
                    userData[`day_${i}_praise`] = !!dayData?.praise;
                    userData[`day_${i}_lateTime`] = typeof dayData?.lateTime === 'number' ? dayData.lateTime : null;
                    userData[`day_${i}_testScore`] = dayData?.testScore || '';
                }
                return userData;
            });

            setUsers(attendanceUsers);
        },
        [date]
    );
    const loadAttendance = async () => {
        try {
            const year = date?.getFullYear().toString();
            const month = String(date?.getMonth()! + 1).padStart(2, '0');
            const response = await http.get('/choiMath/attendance/getAttendance', {
                params: { classId: selectedClass, year, month }
            });
            const attendanceList = response.data || [];

            if (attendanceList.length === 0) {
                await http.post('/choiMath/attendance/insertAttendance', { classId: selectedClass, year, month });
                showToast({ severity: 'success', summary: '출석부 생성 완료', detail: '출석부 신규생성완료!' });
                const retryResponse = await http.get('/choiMath/attendance/getAttendance', {
                    params: { classId: selectedClass, year, month }
                });
                processAttendanceData(retryResponse.data?.[0]);
            } else {
                processAttendanceData(attendanceList[0]);
            }
            scrolled.current = false;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || '출석부를 불러오는데 실패했습니다.';
            showToast({ severity: 'error', summary: '조회 실패', detail: errorMessage });
            setUsers([]);
        }
    };
    useEffect(() => {
        if (!selectedClass || !date) {
            if (users.length > 0) setUsers([]);
            return;
        }

        loadAttendance();
    }, [selectedClass, date]);

    const scrollToDate = useCallback(
        (targetDate: Date, smooth = false, showSuccessToast = false) => {
            if (!date || !tableWrapperRef.current) return;

            if (targetDate.getFullYear() === date.getFullYear() && targetDate.getMonth() === date.getMonth()) {
                const day = targetDate.getDate();

                const totalWidth = widthPx
                    .split(' ') // 1. 공백을 기준으로 쪼개서 배열로 만듦
                    .map((item) => parseInt(item)) // 2. 각 요소에서 숫자만 추출 (parseInt는 'px'를 무시하고 숫자만 남깁니다)
                    .reduce((acc, cur) => acc + cur, 0); // 3. 배열의 모든 숫자를 합산
                const dayWidth = totalWidth;
                const scrollPos = (day - 1) * dayWidth;

                requestAnimationFrame(() => {
                    const wrapper = tableWrapperRef.current;
                    if (!wrapper) return;
                    const maxScroll = wrapper.scrollWidth - wrapper.clientWidth;
                    const finalScrollPos = Math.max(0, Math.min(scrollPos, maxScroll));
                    wrapper.scrollTo({ left: finalScrollPos, behavior: smooth ? 'smooth' : 'auto' });
                    scrolled.current = true;
                    if (showSuccessToast) {
                        showToast({
                            severity: 'success',
                            summary: '날짜 이동',
                            detail: `${targetDate.getMonth() + 1}월 ${targetDate.getDate()}일로 이동했습니다.`
                        });
                    }
                });
            }
        },
        [date, showToast]
    );

    const handleMoveToday = useCallback(() => {
        if (!date) return;
        const now = new Date();
        if (now.getFullYear() === date.getFullYear() && now.getMonth() === date.getMonth()) {
            scrollToDate(now, true);
        }
    }, [date, scrollToDate]);

    useEffect(() => {
        if (!scrolled.current && users.length > 0) {
            const timer = setTimeout(() => handleMoveToday(), 300);
            return () => clearTimeout(timer);
        }
    }, [users, handleMoveToday]);

    const handleUserUpdate = useCallback((userId: number, field: string, value: any) => {
        setUsers((currentUsers) =>
            currentUsers.map((user) => (user.id === userId ? { ...user, [field]: value } : user))
        );
    }, []);

    const handleClassChange = (e: DropdownChangeEvent) => setSelectedClass(e.value as string);

    const handleDateSelect = (selectedDate: Date | null) => {
        if (!selectedDate) return;
        setSelectedScrollDate(selectedDate);
        scrollToDate(selectedDate, true, true);
        datePickerOverlayRef.current?.hide();
    };

    const filteredUsers = useMemo(() => {
        if (!globalFilterValue) return users;
        return users.filter((user) => user.name.toLowerCase().includes(globalFilterValue.toLowerCase()));
    }, [users, globalFilterValue]);

    const formatAttendanceData = () => {
        if (!selectedClass || !date) return null;

        const year = date.getFullYear().toString();
        const month = String(date.getMonth() + 1).padStart(2, '0');

        return {
            classId: selectedClass,
            year,
            month,
            students: users.map((user) => {
                const attendance: { [key: string]: any } = {};
                for (const key in user) {
                    if (key.startsWith('day_') && key.endsWith('_attendance')) {
                        const day = key.split('_')[1];
                        attendance[day] = {
                            status: user[key],
                            homework: user[`day_${day}_homework`],
                            note: user[`day_${day}_note`],
                            // specialNote: user[`specialNote`],
                            praise: user[`day_${day}_praise`],
                            lateTime: user[`day_${day}_lateTime`],
                            testScore: user[`day_${day}_testScore`],
                            date: `${year}${month}${String(day).padStart(2, '0')}`,
                            statusTime: user.statusTime || new Date()
                        };
                    }
                }
                return {
                    studentId: user.studentId,
                    name: user.name,
                    grade: user.grade,
                    school: user.school,
                    specialNote: user.specialNote,
                    attendance
                };
            })
        };
    };

    const handleAllPresent = () => {
        if (!users) return;
        // console.log('users', users);
        const today = dayjs().format('D');
        const dayAttendance = `day_${today}_attendance`;
        setUsers(users.map((item) => ({ ...item, [dayAttendance]: 'class_present', statusTime: new Date() })));
        handleMoveToday();
        showToast({
            severity: 'success',
            summary: '전체 출석 체크',
            detail: '전원 출석 체크 완료. 저장이 필요합니다.'
        });
    };

    const handleSave = async () => {
        const dataToSave = formatAttendanceData();
        if (!dataToSave) {
            showToast({ severity: 'warn', summary: '저장 불가', detail: '클래스와 월을 선택해주세요.' });
            return;
        }

        try {
            await http.post('/choiMath/attendance/saveAttendance', dataToSave);
            showToast({ severity: 'success', summary: '저장 성공', detail: '출석부가 저장되었습니다.' });
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || '출석부 저장에 실패했습니다.';
            showToast({ severity: 'error', summary: '저장 실패', detail: errorMessage });
        }
    };

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => setGlobalFilterValue(e.target.value);

    const shouldUseVirtualScroll = filteredUsers.length >= VIRTUAL_SCROLL_THRESHOLD;

    const virtualizer = useVirtualizer({
        count: filteredUsers.length,
        getScrollElement: () => tableBodyRef.current,
        estimateSize: () => 50,
        overscan: 5
    });

    if (!date) return <div>Loading...</div>;

    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    const widthPx = '140px 120px 70px 70px 160px 160px';
    // 컬럼 width적용 (출석, 숙제, 칭찬, 점수, 비고(칭찬), 비고(특이사항))
    const dayColumnTemplates = Array.from({ length: daysInMonth }, () => widthPx).join(' ');
    return (
        <>
            <style>{`
                .attendance-table {
                    display: grid;
                    grid-template-columns: 150px ${dayColumnTemplates};
                    width: max-content;
                    min-width: 100%;
                    border: 1px solid var(--surface-border);
                }
                
                .attendance-header { display: contents; }
                .attendance-header-row { display: contents; }
                .attendance-header-cell-name {
                    position: sticky; left: 0; background: var(--surface-card); z-index: 10;
                    padding: 8px; border: 1px solid var(--surface-border); border-bottom: 2px solid var(--primary-color);
                    text-align: center; font-weight: bold; grid-row: span 2;
                    color: var(--text-color);
                }
                .attendance-header-day-group {
                    grid-column: span 6;
                    padding: 8px; border: 1px solid var(--surface-border); border-bottom: 1px solid var(--surface-border);
                    text-align: center; font-weight: bold;
                    color: var(--text-color);
                }
                .attendance-header-sub-cell {
                    padding: 8px; border: 1px solid var(--surface-border); text-align: center;
                    font-weight: bold; background: var(--surface-ground); border-bottom: 2px solid var(--primary-color);
                    color: var(--text-color);
                }
                
                .attendance-body { display: contents; }
                .attendance-row { display: contents; }
                
                .attendance-cell-name {
                    position: sticky; left: 0; background: var(--surface-card); z-index: 5;
                    padding: 8px; border: 1px solid var(--surface-border); border-right: 2px solid var(--primary-color);
                    font-weight: 500;
                    color: var(--text-color);
                }
                
                .attendance-day-group { display: contents; }
                
                .attendance-cell {
                    padding: 4px;
                    border-right: 1px solid var(--surface-border);
                    border-bottom: 1px solid var(--surface-border);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-color);
                }
                .attendance-day-group .attendance-cell:last-of-type {
                    border-right: 2px solid var(--primary-color);
                }
                
                .attendance-table-wrapper {
                    overflow-x: auto;
                    overflow-y: ${shouldUseVirtualScroll ? 'auto' : 'visible'};
                    max-height: ${shouldUseVirtualScroll ? '600px' : 'none'};
                    border: 1px solid var(--surface-border);
                    width: 100%;
                    position: relative;
                }
                
                .p-dropdown-panel { z-index: 9999 !important; }
            `}</style>
            <div className="grid">
                <div className="col-12">
                    <div className="card">
                        <h5>출석부</h5>
                        <div className="grid formgrid p-fluid mb-3 force-horizontal pb-2">
                            <div className="field col-12 md:col-4 no-shrink min-w-300">
                                <label htmlFor="class-selector">
                                    수업클래스 선택 <span className="text-red-500 ml-1">*</span>
                                </label>
                                <Dropdown
                                    id="class-selector"
                                    value={selectedClass}
                                    options={classes}
                                    scrollHeight="400px"
                                    onChange={handleClassChange}
                                    placeholder="클래스 선택"
                                    optionLabel="label"
                                    optionValue="value"
                                    showClear
                                />
                            </div>
                            <div className="field col-12 md:col-3 no-shrink min-w-200">
                                <label htmlFor="monthpicker">
                                    월 선택 <span className="text-red-500 ml-1">*</span>
                                </label>
                                <Calendar
                                    locale="ko"
                                    id="monthpicker"
                                    value={date}
                                    onChange={(e) => setDate(e.value as Date)}
                                    view="month"
                                    dateFormat="yy/mm"
                                    appendTo={typeof window !== 'undefined' ? document.body : undefined}
                                />
                            </div>
                            <div className="field col-12 md:col-2 no-shrink min-w-150">
                                <label>&nbsp;</label>
                                <Button
                                    id="refreshBtn"
                                    icon="pi pi-refresh"
                                    rounded
                                    raised
                                    label="새로고침"
                                    onClick={loadAttendance}
                                    className="p-button-primary"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                            <span className="text-xl text-900 font-bold">출석부</span>
                            <div
                                className="attendance-toolbar"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    overflowX: 'auto',
                                    whiteSpace: 'nowrap',
                                    paddingBottom: '8px',
                                    maxWidth: '100%',
                                    WebkitOverflowScrolling: 'touch'
                                }}
                            >
                                <span className="p-input-icon-left no-shrink" style={{ display: 'inline-block' }}>
                                    <i className="pi pi-search" />
                                    <InputText
                                        value={globalFilterValue}
                                        onChange={onGlobalFilterChange}
                                        placeholder="학생 검색"
                                        style={{ width: '200px' }}
                                    />
                                </span>
                                <Button
                                    icon="pi"
                                    rounded
                                    raised
                                    label="오늘 전체 출석"
                                    onClick={handleAllPresent}
                                    className="p-button-success no-shrink"
                                    style={{ width: 'auto', whiteSpace: 'nowrap' }}
                                />
                                <Button
                                    icon="pi pi-save"
                                    severity="warning"
                                    rounded
                                    raised
                                    label="출석부 저장"
                                    onClick={handleSave}
                                    className="p-button-success no-shrink"
                                    style={{ width: 'auto', whiteSpace: 'nowrap' }}
                                />
                                <Button
                                    icon="pi pi-refresh"
                                    rounded
                                    raised
                                    label="오늘날짜로"
                                    onClick={() => {
                                        scrolled.current = false;
                                        handleMoveToday();
                                    }}
                                    className="no-shrink"
                                    style={{ width: 'auto', whiteSpace: 'nowrap' }}
                                />
                                <Button
                                    icon="pi pi-calendar"
                                    rounded
                                    raised
                                    label="날짜 이동"
                                    onClick={(e) => datePickerOverlayRef.current?.toggle(e)}
                                    className="no-shrink"
                                    style={{ width: 'auto', whiteSpace: 'nowrap' }}
                                />
                                <OverlayPanel ref={datePickerOverlayRef} dismissable>
                                    <div className="flex flex-column gap-3" style={{ minWidth: '300px' }}>
                                        <label htmlFor="date-picker" className="font-bold">
                                            이동할 날짜 선택
                                        </label>
                                        <Calendar
                                            id="date-picker"
                                            value={selectedScrollDate}
                                            onChange={(e) => handleDateSelect(e.value as Date)}
                                            dateFormat="yy/mm/dd"
                                            showButtonBar
                                            inline
                                            icon="pi pi-calendar"
                                            placeholder="날짜 선택"
                                            locale="ko"
                                            appendTo={'self'}
                                        />
                                    </div>
                                </OverlayPanel>
                            </div>
                        </div>

                        <style>{`
                            .attendance-toolbar::-webkit-scrollbar {
                                height: 4px;
                            }
                            .attendance-toolbar::-webkit-scrollbar-track {
                                background: var(--surface-ground);
                            }
                            .attendance-toolbar::-webkit-scrollbar-thumb {
                                background: var(--surface-400);
                                border-radius: 10px;
                            }
                            .no-shrink {
                                flex-shrink: 0 !important;
                            }
                        `}</style>

                        <div className="mb-2">
                            <p className="text-red-500 font-bold">
                                <i className="pi pi-exclamation-circle mr-2"></i>
                                비고란에 입력된 내용은 해당 학생이 확인할 수 있습니다. 민감한 내용이나 부적절한 내용을
                                삼가해주세요.
                            </p>
                        </div>

                        <div
                            className="attendance-table-wrapper"
                            ref={tableWrapperRef}
                            role="region"
                            aria-label="출석부 테이블"
                        >
                            <div className="attendance-table" role="table" aria-label="출석부">
                                <AttendanceTableHeader
                                    daysInMonth={daysInMonth}
                                    year={year}
                                    month={month}
                                    totalStudents={filteredUsers.length}
                                    fieldNames={{
                                        attendance: '출석',
                                        homework: '숙제',
                                        praise: '칭찬',
                                        testScore: '점수',
                                        note: '비고',
                                        specialNote: '특이사항'
                                    }}
                                />
                                <div className="attendance-body" role="rowgroup" ref={tableBodyRef}>
                                    {shouldUseVirtualScroll ? (
                                        <div
                                            style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}
                                        >
                                            {virtualizer.getVirtualItems().map((virtualRow) => (
                                                <div
                                                    key={virtualRow.key}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: `${virtualRow.size}px`,
                                                        transform: `translateY(${virtualRow.start}px)`
                                                    }}
                                                >
                                                    <AttendanceRow
                                                        user={filteredUsers[virtualRow.index]}
                                                        daysInMonth={daysInMonth}
                                                        onUpdate={handleUserUpdate}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <AttendanceRow
                                                key={user.id}
                                                user={user}
                                                daysInMonth={daysInMonth}
                                                onUpdate={handleUserUpdate}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AttendancePage;
