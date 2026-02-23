'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Calendar } from 'primereact/calendar';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { OverlayPanel } from 'primereact/overlaypanel';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { Class } from '@/types/class';
import { useVirtualizer } from '@tanstack/react-virtual';
import dayjs from 'dayjs';
import AttendanceRow from './components/AttendanceRow';
import AttendanceTableHeader from './components/AttendanceTableHeader';

// 1. Define Interfaces/Types
interface ClassOption {
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
    [key: string]: any; // For dynamic day_X_attendance and day_X_homework properties
}

const VIRTUAL_SCROLL_THRESHOLD = 50; // 가상 스크롤링 활성화 임계값

const AttendancePage = () => {
    const [date, setDate] = useState<Date | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [selectedClassData, setSelectedClassData] = useState<Class | null>(null);
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
            showToast({
                severity: 'error',
                summary: '조회 실패',
                detail: '클래스 목록을 불러오는데 실패했습니다.'
            });
        }
    };

    // 클래스와 월 선택 시 출석부 데이터 로드
    useEffect(() => {
        if (!selectedClass || !date) {
            // 상태가 이미 비어있으면 업데이트하지 않음
            if (users.length > 0 || selectedClassData !== null) {
                setUsers([]);
                setSelectedClassData(null);
            }
            return;
        }

        const loadAttendance = async () => {
            try {
                const year = date.getFullYear().toString();
                const month = String(date.getMonth() + 1).padStart(2, '0');

                // 출석부 데이터 조회
                const response = await http.get('/choiMath/attendance/getAttendance', {
                    params: {
                        classId: selectedClass,
                        year: year,
                        month: month
                    }
                });

                const attendanceList = response.data || [];

                if (attendanceList.length === 0) {
                    // 출석부가 없으면 신규 생성
                    await http.post('/choiMath/attendance/insertAttendance', {
                        classId: selectedClass,
                        year: year,
                        month: month
                    });

                    showToast({
                        severity: 'success',
                        summary: '출석부 생성 완료',
                        detail: '출석부 신규생성완료!'
                    });

                    // 다시 조회
                    const retryResponse = await http.get('/choiMath/attendance/getAttendance', {
                        params: {
                            classId: selectedClass,
                            year: year,
                            month: month
                        }
                    });

                    const retryAttendanceList = retryResponse.data || [];
                    if (retryAttendanceList.length > 0 && retryAttendanceList[0]) {
                        processAttendanceData(retryAttendanceList[0]);
                    } else {
                        setUsers([]);
                    }
                } else {
                    // 출석부 데이터가 있으면 처리
                    if (attendanceList[0]) {
                        processAttendanceData(attendanceList[0]);
                    } else {
                        setUsers([]);
                    }
                }

                // 스크롤 플래그 리셋 (새 데이터 로드 시 다시 스크롤 가능하도록)
                scrolled.current = false;
            } catch (error: any) {
                console.error('Error loading attendance:', error);
                const errorMessage =
                    error.response?.data?.message || error.message || '출석부를 불러오는데 실패했습니다.';
                showToast({ severity: 'error', summary: '조회 실패', detail: errorMessage });
                setUsers([]);
                setSelectedClassData(null);
            }
        };

        const processAttendanceData = (attendanceData: any) => {
            if (!attendanceData) {
                setUsers([]);
                return;
            }

            const year = date.getFullYear();
            const month = date.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            // 출석부의 학생 데이터를 User 형태로 변환
            const attendanceUsers: User[] = (attendanceData.students || []).map((student: any, index: number) => {
                const userData: User = {
                    id: index + 1,
                    studentId: student.studentId,
                    name: student.name || '이름 없음',
                    grade: student.grade || '',
                    school: student.school || ''
                };

                // 각 날짜에 대한 출석/숙제/비고/지각시간 데이터 설정
                for (let i = 1; i <= daysInMonth; i++) {
                    const dayKey = i.toString();
                    if (student.attendance && student.attendance[dayKey]) {
                        userData[`day_${i}_attendance`] = student.attendance[dayKey]?.status || 'none';
                        userData[`day_${i}_homework`] = student.attendance[dayKey]?.homework || 0;
                        userData[`day_${i}_note`] = student.attendance[dayKey]?.note || '';
                        const lateTimeValue = student.attendance[dayKey]?.lateTime;
                        userData[`day_${i}_lateTime`] = typeof lateTimeValue === 'number' ? lateTimeValue : null;
                    } else {
                        userData[`day_${i}_attendance`] = 'none';
                        userData[`day_${i}_homework`] = 0;
                        userData[`day_${i}_note`] = '';
                        userData[`day_${i}_lateTime`] = null;
                    }
                }
                return userData;
            });

            setUsers(attendanceUsers);
        };

        loadAttendance();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date, selectedClass]);

    // 특정 날짜로 스크롤하는 함수
    const scrollToDate = useCallback(
        (targetDate: Date, smooth: boolean = false, showSuccessToast: boolean = false): void => {
            if (typeof window === 'undefined' || !date || !tableWrapperRef.current) {
                return;
            }

            // 선택한 날짜가 현재 표시된 월과 같은지 확인
            if (targetDate.getFullYear() === date.getFullYear() && targetDate.getMonth() === date.getMonth()) {
                const day = targetDate.getDate();
                const attendanceColWidth = 150;
                const homeworkColWidth = 120;
                const noteColWidth = 150;
                const dayWidth = attendanceColWidth + homeworkColWidth + noteColWidth;
                const scrollPos = (day - 1) * dayWidth;

                requestAnimationFrame(() => {
                    if (!tableWrapperRef.current) return;

                    const wrapper = tableWrapperRef.current;
                    const maxScroll = wrapper.scrollWidth - wrapper.clientWidth;

                    if (maxScroll <= 0) {
                        showToast({
                            severity: 'warn',
                            summary: '스크롤 불가',
                            detail: '테이블이 컨테이너보다 작아 스크롤할 수 없습니다.'
                        });
                        return;
                    }

                    const finalScrollPos = Math.max(0, Math.min(scrollPos, maxScroll));

                    if (smooth) {
                        wrapper.scrollTo({
                            left: finalScrollPos,
                            behavior: 'smooth'
                        });
                    } else {
                        wrapper.scrollLeft = finalScrollPos;
                    }
                    scrolled.current = true;

                    if (showSuccessToast) {
                        showToast({
                            severity: 'success',
                            summary: '날짜 이동',
                            detail: `${targetDate.getMonth() + 1}월 ${targetDate.getDate()}일로 이동했습니다.`
                        });
                    }
                });
            } else {
                showToast({
                    severity: 'warn',
                    summary: '날짜 오류',
                    detail: '선택한 날짜는 현재 표시된 월과 다릅니다. 먼저 해당 월을 선택해주세요.'
                });
            }
        },
        [date, showToast]
    );

    const handleMoveToday = useCallback((): void => {
        if (typeof window === 'undefined' || !date || !tableWrapperRef.current) {
            return;
        }
        const now = new Date();
        // Only scroll if the table is showing the current month and year
        if (now.getFullYear() === date.getFullYear() && now.getMonth() === date.getMonth()) {
            scrollToDate(now);
        }
    }, [date, scrollToDate]);

    // 테이블이 렌더링된 후 오늘 날짜로 스크롤
    useEffect(() => {
        if (!date || !selectedClass || users.length === 0) {
            return;
        }
        // 이미 스크롤했으면 다시 스크롤하지 않음
        if (scrolled.current) {
            return;
        }
        // 테이블이 렌더링될 시간을 주기 위해 약간의 지연
        const timer = setTimeout(() => {
            handleMoveToday();
        }, 300);
        return () => clearTimeout(timer);
    }, [date, selectedClass, users.length, handleMoveToday]);

    const handleUserUpdate = useCallback((userId: number, field: string, value: any) => {
        setUsers((currentUsers) =>
            currentUsers.map((user) => (user.id === userId ? { ...user, [field]: value } : user))
        );
    }, []);

    const handleClassChange = (e: DropdownChangeEvent) => {
        setSelectedClass(e.value as string);
    };

    // 날짜 선택 핸들러
    const handleDateSelect = (selectedDate: Date | null) => {
        if (!selectedDate) return;

        setSelectedScrollDate(selectedDate);

        // 날짜로 스크롤 (성공 토스트 포함)
        scrollToDate(selectedDate, true, true);

        // OverlayPanel 닫기
        if (datePickerOverlayRef.current) {
            datePickerOverlayRef.current.hide();
        }
    };

    // 검색 기능 최적화
    const filteredUsers = useMemo(() => {
        if (!globalFilterValue) return users;
        return users.filter((user) => user.name.toLowerCase().includes(globalFilterValue.toLowerCase()));
    }, [users, globalFilterValue]);

    // Helper function to format attendance data for saving
    const formatAttendanceData = () => {
        if (!selectedClass || !date) {
            console.warn('Cannot format data: class or date not selected.');
            return null;
        }

        const year = date.getFullYear().toString();
        const month = String(date.getMonth() + 1).padStart(2, '0');

        const formattedStudents = users.map((user) => {
            const attendance: {
                [key: string]: {
                    status: string;
                    homework: number;
                    note?: string;
                    date: string;
                    statusTime: Date;
                };
            } = {};
            for (const key in user) {
                if (key.startsWith('day_') && key.endsWith('_attendance')) {
                    const day = key.split('_')[1];
                    const homeworkKey = `day_${day}_homework`;
                    const noteKey = `day_${day}_note`;
                    const lateTimeKey = `day_${day}_lateTime`;
                    // 날짜를 yyyymmdd 형태로 생성
                    const dayStr = String(day).padStart(2, '0');
                    const dateStr = `${year}${month}${dayStr}`;
                    const status = user[key] as string;
                    const attendanceEntry: {
                        status: string;
                        homework: number;
                        note?: string;
                        lateTime?: number;
                        date: string;
                        statusTime: Date;
                    } = {
                        status: status,
                        homework: user[homeworkKey] as number,
                        note: (user[noteKey] as string) || '',
                        statusTime: (user[`statusTime`] as any) || dayjs().toDate(),
                        date: dateStr
                    };
                    
                    // 지각 상태일 때만 지각 시간 추가 (분 단위 숫자)
                    if (status === 'late') {
                        const lateTimeValue = user[lateTimeKey];
                        if (typeof lateTimeValue === 'number') {
                            attendanceEntry.lateTime = lateTimeValue;
                        }
                    }
                    
                    attendance[day] = attendanceEntry;
                }
            }
            return {
                studentId: user.studentId || '',
                name: user.name,
                grade: user.grade || '',
                school: user.school || '',
                attendance: attendance
            };
        });

        return {
            classId: selectedClass,
            year: year,
            month: month,
            students: formattedStudents
        };
    };

    // 전체 출석체크
    const handleAllPresent = () => {
        if (!users) return;
        const status = 'class_present';
        const today = dayjs().format('DD');
        const dayAttendance = `day_${today}_attendance`;
        const userList = users.map((item) => {
            return { ...item, [dayAttendance]: status, ['statusTime']: dayjs().toDate() };
        });
        setUsers(userList);
    };

    // 출석부 저장
    const handleSave = async () => {
        if (!selectedClass || !date) {
            showToast({
                severity: 'warn',
                summary: '저장 불가',
                detail: '클래스와 월을 선택해주세요.'
            });
            return;
        }

        const dataToSave = formatAttendanceData();
        if (!dataToSave) {
            showToast({
                severity: 'error',
                summary: '저장 실패',
                detail: '저장할 데이터가 없습니다.'
            });
            return;
        }

        try {
            await http.post('/choiMath/attendance/saveAttendance', dataToSave);
            showToast({
                severity: 'success',
                summary: '저장 성공',
                detail: '출석부가 저장되었습니다.'
            });
        } catch (error: any) {
            console.error('Error saving attendance:', error);
            const errorMessage = error.response?.data?.message || error.message || '출석부 저장에 실패했습니다.';
            showToast({ severity: 'error', summary: '저장 실패', detail: errorMessage });
        }
    };

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target?.value || '';
        setGlobalFilterValue(value);
    };

    // 가상 스크롤링 활성화 여부 결정 (date가 없어도 계산 가능)
    const shouldUseVirtualScroll = filteredUsers.length >= VIRTUAL_SCROLL_THRESHOLD;

    // 가상 스크롤러 설정 (항상 호출되어야 함 - React Hooks 규칙 준수)
    // 조건부 활성화는 렌더링 단계에서 처리
    const virtualizer = useVirtualizer({
        count: filteredUsers.length,
        getScrollElement: () => tableBodyRef.current,
        estimateSize: () => 50, // 각 행의 예상 높이
        overscan: 5 // 화면 밖에 렌더링할 추가 행 수
    });

    if (!date) {
        return <div>Loading...</div>;
    }

    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const year: number = date.getFullYear();
    const month: number = date.getMonth();

    return (
        <>
            <style>{`
                .attendance-table {
                    display: grid;
                    grid-template-columns: 150px repeat(${daysInMonth * 3}, 140px);
                    width: max-content;
                    min-width: 100%;
                    border: 1px solid #dee2e6;
                }
                
                .attendance-header {
                    display: contents;
                }
                
                .attendance-header-row {
                    display: contents;
                }
                
                .attendance-header-cell-name {
                    position: sticky;
                    left: 0;
                    background: white;
                    z-index: 10;
                    padding: 8px;
                    border: 1px solid #dee2e6;
                    border-bottom: 2px solid #007ad9;
                    text-align: center;
                    font-weight: bold;
                    grid-row: span 2;
                }
                
                .attendance-header-day-group {
                    grid-column: span 3;
                    padding: 8px;
                    border: 1px solid #dee2e6;
                    border-bottom: 1px solid #dee2e6;
                    text-align: center;
                    font-weight: bold;
                }
                
                .attendance-header-sub-cell {
                    padding: 8px;
                    border: 1px solid #dee2e6;
                    text-align: center;
                    font-weight: bold;
                    background: #f8f9fa;
                    border-bottom: 2px solid #007ad9;
                }
                
                .attendance-body {
                    display: contents;
                }
                
                .attendance-row {
                    display: contents;
                }
                
                .attendance-cell-name {
                    position: sticky;
                    left: 0;
                    background: white;
                    z-index: 5;
                    padding: 8px;
                    border: 1px solid #dee2e6;
                    border-right: 2px solid #007ad9;
                    font-weight: 500;
                }
                
                .attendance-day-group {
                    display: contents;
                }
                
                .attendance-cell {
                    padding: 4px;
                    border-right: 1px solid #dee2e6;
                    border-bottom: 1px solid #dee2e6;
                }
                
                .attendance-day-group .attendance-cell:last-child {
                    border-right: 2px solid #007ad9;
                }
                
                .attendance-table-wrapper {
                    overflow-x: auto;
                    overflow-y: ${shouldUseVirtualScroll ? 'auto' : 'visible'};
                    max-height: ${shouldUseVirtualScroll ? '600px' : 'none'};
                    border: 1px solid #dee2e6;
                    width: 100%;
                    position: relative;
                }
                
                .p-dropdown-panel {
                    z-index: 9999 !important;
                }
            `}</style>
            <div className="grid">
                <div className="col-12">
                    <div className="card">
                        <h5>출석부</h5>
                        <div className="grid formgrid p-fluid mb-3">
                            <div className="field col-12 md:col-3">
                                <label htmlFor="class-selector">수업클래스 선택</label>
                                <Dropdown
                                    id="class-selector"
                                    value={selectedClass}
                                    options={classes}
                                    onChange={handleClassChange}
                                    placeholder="클래스 선택"
                                    optionLabel="label"
                                    optionValue="value"
                                    showClear
                                />
                            </div>
                            <div className="field col-12 md:col-3">
                                <label htmlFor="monthpicker">월 선택</label>
                                <Calendar
                                    id="monthpicker"
                                    value={date}
                                    onChange={(e) => setDate(e.value as Date)}
                                    view="month"
                                    dateFormat="yy/mm"
                                />
                            </div>
                        </div>

                        {/* 헤더 */}
                        <div className="flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                            <span className="text-xl text-900 font-bold">출석부</span>
                            <div className="flex align-items-center gap-2">
                                <span className="p-input-icon-left">
                                    <i className="pi pi-search" />
                                    <InputText
                                        value={globalFilterValue}
                                        onChange={onGlobalFilterChange}
                                        placeholder="학생 검색"
                                    />
                                </span>
                                <Button
                                    icon="pi"
                                    rounded
                                    raised
                                    label="오늘 전체 출석"
                                    onClick={handleAllPresent}
                                    className="p-button-success"
                                />
                                <Button
                                    icon="pi pi-save"
                                    rounded
                                    raised
                                    label="출석부 저장"
                                    onClick={handleSave}
                                    className="p-button-success"
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
                                />
                                <Button
                                    icon="pi pi-calendar"
                                    rounded
                                    raised
                                    label="날짜 이동"
                                    onClick={(e) => {
                                        if (datePickerOverlayRef.current) {
                                            datePickerOverlayRef.current.toggle(e);
                                        }
                                    }}
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
                                            showIcon
                                            icon="pi pi-calendar"
                                            placeholder="날짜 선택"
                                        />
                                        <div className="flex gap-2 justify-content-end">
                                            <Button
                                                label="취소"
                                                severity="secondary"
                                                size="small"
                                                onClick={() => {
                                                    if (datePickerOverlayRef.current) {
                                                        datePickerOverlayRef.current.hide();
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </OverlayPanel>
                            </div>
                        </div>

                        {/* 테이블 */}
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
                                />
                                <div className="attendance-body" role="rowgroup" ref={tableBodyRef}>
                                    {shouldUseVirtualScroll ? (
                                        <div
                                            style={{
                                                height: `${virtualizer.getTotalSize()}px`,
                                                position: 'relative'
                                            }}
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
