'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { Calendar } from 'primereact/calendar';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { Class } from '@/types/class';
import {
    ATTENDANCE_STATUS_OPTIONS,
    HOMEWORK_PROGRESS_OPTIONS,
    DAY_NAMES,
    HOLIDAYS,
    getAttendanceSeverity
} from '@/constants/attendance';

// 1. Define Interfaces/Types
interface ClassOption {
    label: string;
    value: string;
    classId: string;
}

interface AttendanceStatusOption {
    label: string;
    value: string;
}

interface HomeworkProgressOption {
    label: string;
    value: number;
}

interface User {
    id: number;
    studentId?: string;
    name: string;
    [key: string]: string | number | undefined; // For dynamic day_X_attendance and day_X_homework properties
}


// Optimized and Memoized Cell Components
interface AttendanceCellProps {
    value: string;
    options: AttendanceStatusOption[];
    onChange: (value: string) => void;
}

const AttendanceCell: React.FC<AttendanceCellProps> = ({ value, options, onChange }) => {
    return (
        <Dropdown
            value={value}
            options={options}
            onChange={(e: DropdownChangeEvent) => onChange(e.value)}
            itemTemplate={(option: AttendanceStatusOption) => (
                <Tag value={option.label} severity={getAttendanceSeverity(option.value) as any} />
            )}
            valueTemplate={(option: AttendanceStatusOption) => {
                if (option) {
                    return <Tag value={option.label} severity={getAttendanceSeverity(option.value) as any} />;
                }
                return <span>선택</span>;
            }}
            style={{ width: '100%' }}
            appendTo={typeof window !== 'undefined' ? document.body : 'self'}
            panelStyle={{ zIndex: 9999 }}
        />
    );
};

const MemoizedAttendanceCell = React.memo(AttendanceCell);

interface HomeworkCellProps {
    value: number;
    options: HomeworkProgressOption[];
    onChange: (value: number) => void;
}

const HomeworkCell: React.FC<HomeworkCellProps> = ({ value, options, onChange }) => {
    return (
        <Dropdown
            value={value}
            options={options}
            onChange={(e: DropdownChangeEvent) => onChange(e.value)}
            style={{ width: '100%' }}
            appendTo={typeof window !== 'undefined' ? document.body : 'self'}
            panelStyle={{ zIndex: 9999 }}
        />
    );
};

const MemoizedHomeworkCell = React.memo(HomeworkCell);

const AttendancePage = () => {
    // 2. Apply Types to State
    const [date, setDate] = useState<Date | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [selectedClassData, setSelectedClassData] = useState<Class | null>(null);
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [globalFilter, setGlobalFilter] = useState<string>('');
    const http = useHttp();
    const { showToast } = useToast();
    // 3. Apply Types to useRef
    const dt = useRef<DataTable<any>>(null);
    const scrolled = useRef<boolean>(false);

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

    const holidays: string[] = [...HOLIDAYS];
    const dayNames: string[] = [...DAY_NAMES];
    const attendanceStatuses: AttendanceStatusOption[] = [...ATTENDANCE_STATUS_OPTIONS];
    const homeworkProgressOptions: HomeworkProgressOption[] = [...HOMEWORK_PROGRESS_OPTIONS];

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
                    if (retryAttendanceList.length > 0) {
                        processAttendanceData(retryAttendanceList[0]);
                    }
                } else {
                    // 출석부 데이터가 있으면 처리
                    processAttendanceData(attendanceList[0]);
                }
                
                scrolled.current = false;
            } catch (error: any) {
                console.error('Error loading attendance:', error);
                const errorMessage = error.response?.data?.message || error.message || '출석부를 불러오는데 실패했습니다.';
                showToast({ severity: 'error', summary: '조회 실패', detail: errorMessage });
                setUsers([]);
                setSelectedClassData(null);
            }
        };

        const processAttendanceData = (attendanceData: any) => {
            const year = date.getFullYear();
            const month = date.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            // 출석부의 학생 데이터를 User 형태로 변환
            const attendanceUsers: User[] = (attendanceData.students || []).map((student: any, index: number) => {
                const userData: User = {
                    id: index + 1,
                    studentId: student.studentId,
                    name: student.name || '이름 없음'
                };
                
                // 각 날짜에 대한 출석/숙제 데이터 설정
                for (let i = 1; i <= daysInMonth; i++) {
                    const dayKey = i.toString();
                    if (student.attendance && student.attendance[dayKey]) {
                        userData[`day_${i}_attendance`] = student.attendance[dayKey].status || 'none';
                        userData[`day_${i}_homework`] = student.attendance[dayKey].homework || 0;
                    } else {
                        userData[`day_${i}_attendance`] = 'none';
                        userData[`day_${i}_homework`] = 0;
                    }
                }
                return userData;
            });
            
            setUsers(attendanceUsers);
        };

        loadAttendance();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date, selectedClass]);

    useEffect(() => {
        if (!date) return;
        // 빌드용
        setTimeout(() => {
            handleMoveToday();
        }, 500);
    }, [date]);

    const handleMoveToday = (): void => {
        if (typeof window === 'undefined' || !date) {
            return; // Do not run on server
        }
        const now = new Date();
        // Only scroll if the table is showing the current month and year
        if (now.getFullYear() === date.getFullYear() && now.getMonth() === date.getMonth()) {
            const wrapper = dt.current?.getElement().querySelector('.p-datatable-wrapper');
            if (wrapper) {
                const today = now.getDate();
                const attendanceColWidth = 152.26;
                const homeworkColWidth = 128;
                const dayWidth = attendanceColWidth + homeworkColWidth;
                // Scroll to the column before today, so today is visible
                const scrollPos = (today - 1) * dayWidth - 200;

                wrapper.scrollLeft = scrollPos > 0 ? scrollPos : 0;
                scrolled.current = true;
            }
        }
    };

    const handleUserUpdate = useCallback((userId: number, field: string, value: any) => {
        setUsers((currentUsers) =>
            currentUsers.map((user) => (user.id === userId ? { ...user, [field]: value } : user))
        );
    }, []);

    const handleClassChange = (e: DropdownChangeEvent) => {
        setSelectedClass(e.value as string);
    };

    // Helper function to format attendance data for saving
    const formatAttendanceData = () => {
        if (!selectedClass || !date) {
            console.warn('Cannot format data: class or date not selected.');
            return null;
        }

        const year = date.getFullYear().toString();
        const month = String(date.getMonth() + 1).padStart(2, '0');

        const formattedStudents = users.map((user) => {
            const attendance: { [key: string]: { status: string; homework: number } } = {};
            for (const key in user) {
                if (key.startsWith('day_') && key.endsWith('_attendance')) {
                    const day = key.split('_')[1];
                    const homeworkKey = `day_${day}_homework`;
                    attendance[day] = {
                        status: user[key] as string,
                        homework: user[homeworkKey] as number
                    };
                }
            }
            return {
                studentId: user.studentId || '',
                name: user.name,
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

    // 출석부 저장
    const handleSave = async () => {
        if (!selectedClass || !date) {
            showToast({ severity: 'warn', summary: '저장 불가', detail: '클래스와 월을 선택해주세요.' });
            return;
        }

        const dataToSave = formatAttendanceData();
        if (!dataToSave) {
            showToast({ severity: 'error', summary: '저장 실패', detail: '저장할 데이터가 없습니다.' });
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

    if (!date) {
        return <div>Loading...</div>;
    }

    const nameColumnHeader = (
        <div className="flex justify-content-between align-items-center">
            <span>이름</span>
            <span>총 {users.length}명</span>
        </div>
    );

    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const dayHeaders: number[] = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const year: number = date.getFullYear();
    const month: number = date.getMonth();
    const monthStr: string = String(month + 1).padStart(2, '0');

    const headerGroup = (
        <ColumnGroup>
            <Row>
                <Column header="학생" rowSpan={2} frozen />
                {dayHeaders.map((day: number) => {
                    const dayStr: string = String(day).padStart(2, '0');
                    const currentDate: Date = new Date(year, month, day);
                    const dayOfWeek: number = currentDate.getDay();
                    const dateStr: string = `${year}-${monthStr}-${dayStr}`;

                    const style: React.CSSProperties = { textAlign: 'center' };
                    if (dayOfWeek === 0 || holidays.includes(dateStr)) {
                        style.color = 'red';
                    } else if (dayOfWeek === 6) {
                        style.color = 'blue';
                    }

                    const headerText: string = `${monthStr}-${dayStr} (${dayNames[dayOfWeek]})`;
                    const borderStyle: React.CSSProperties = { 
                        ...style, 
                        borderRight: day < daysInMonth ? '2px solid #007ad9' : 'none' 
                    };

                    return <Column key={`day_${day}`} header={headerText} colSpan={2} headerStyle={borderStyle} />;
                })}
            </Row>
            <Row>
                {dayHeaders.flatMap((day: number) => [
                    <Column key={`sub_att_${day}`} header="출석" headerStyle={{ borderRight: '1px solid #dee2e6' }} />,
                    <Column key={`sub_hw_${day}`} header="숙제" headerStyle={{ borderRight: day < daysInMonth ? '2px solid #007ad9' : 'none' }} />
                ])}
            </Row>
        </ColumnGroup>
    );

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl text-900 font-bold">출석부</span>
            <div className="flex align-items-center gap-2">
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        placeholder="학생 검색"
                    />
                </span>
                <Button
                    icon="pi pi-save"
                    rounded
                    raised
                    label="출석부 저장"
                    onClick={handleSave}
                    className="p-button-success"
                />
                <Button icon="pi pi-refresh" rounded raised label="오늘날짜로" onClick={handleMoveToday} />
            </div>
        </div>
    );

    const dynamicColumns: JSX.Element[] = dayHeaders.flatMap((day: number) => {
        const attendanceField = `day_${day}_attendance`;
        const homeworkField = `day_${day}_homework`;
        return [
            <Column
                key={attendanceField}
                field={attendanceField}
                body={(rowData: User) => (
                    <MemoizedAttendanceCell
                        value={rowData[attendanceField] as string}
                        options={attendanceStatuses}
                        onChange={(value) => handleUserUpdate(rowData.id, attendanceField, value)}
                    />
                )}
                style={{ minWidth: '150px', borderRight: '1px solid #dee2e6' }}
            />,
            <Column
                key={homeworkField}
                field={homeworkField}
                body={(rowData: User) => (
                    <MemoizedHomeworkCell
                        value={rowData[homeworkField] as number}
                        options={homeworkProgressOptions}
                        onChange={(value) => handleUserUpdate(rowData.id, homeworkField, value)}
                    />
                )}
                style={{ minWidth: '120px', borderRight: day < daysInMonth ? '2px solid #007ad9' : 'none' }}
            />
        ];
    });

    return (
        <>
            <style>{`
                .p-datatable .p-datatable-thead > tr > th .p-column-header-content {
                    justify-content: center;
                }
                .p-dropdown-panel {
                    z-index: 9999 !important;
                }
                .p-datatable .p-datatable-tbody > tr > td {
                    border-right: 1px solid #dee2e6;
                }
                .p-datatable .p-datatable-tbody > tr > td:last-child {
                    border-right: none;
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

                        <DataTable
                            ref={dt}
                            value={users}
                            headerColumnGroup={headerGroup}
                            header={header}
                            scrollable
                            style={{ marginTop: '20px' }}
                            globalFilter={globalFilter}
                        >
                            <Column
                                key="name"
                                field="name"
                                header={nameColumnHeader}
                                frozen
                                style={{ minWidth: '150px', zIndex: 1 }}
                                sortable
                            />
                            {dynamicColumns}
                        </DataTable>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AttendancePage;
