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

// 1. Define Interfaces/Types
interface ClassOption {
    label: string;
    value: string;
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
    name: string;
    [key: string]: string | number; // For dynamic day_X_attendance and day_X_homework properties
}

const getAttendanceSeverity = (status: string): 'success' | 'danger' | 'info' | 'warning' | 'primary' | 'secondary' => {
    switch (status) {
        case 'class_present':
            return 'success';
        case 'class_absent':
            return 'danger';
        case 'makeup_present':
            return 'info';
        case 'makeup_absent':
            return 'warning';
        case 'clinic_present':
            return 'primary';
        case 'clinic_absent':
            return 'danger';
        default:
            return 'secondary';
    }
};

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
            appendTo="self"
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
            appendTo="self"
        />
    );
};

const MemoizedHomeworkCell = React.memo(HomeworkCell);

const AttendancePage = () => {
    // 2. Apply Types to State
    const [date, setDate] = useState<Date | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [globalFilter, setGlobalFilter] = useState<string>('');
    // 3. Apply Types to useRef
    const dt = useRef<DataTable<any>>(null);
    const scrolled = useRef<boolean>(false);

    useEffect(() => {
        setDate(new Date());
    }, []);

    const holidays: string[] = ['2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18'];
    const dayNames: string[] = ['일', '월', '화', '수', '목', '금', '토'];

    const classes: ClassOption[] = [
        { label: '고급 수학', value: 'adv_math' },
        { label: '초급 물리', value: 'beg_physics' },
        { label: '화학 실험', value: 'chem_lab' }
    ];

    const attendanceStatuses: AttendanceStatusOption[] = [
        { label: '없음', value: 'none' },
        { label: '수업출석', value: 'class_present' },
        { label: '수업결석', value: 'class_absent' },
        { label: '보강출석', value: 'makeup_present' },
        { label: '보강결석', value: 'makeup_absent' },
        { label: '클리닉출석', value: 'clinic_present' },
        { label: '클리닉결석', value: 'clinic_absent' }
    ];

    const homeworkProgressOptions: HomeworkProgressOption[] = [
        { label: '0%', value: 0 },
        { label: '25%', value: 25 },
        { label: '50%', value: 50 },
        { label: '75%', value: 75 },
        { label: '100%', value: 100 }
    ];

    useEffect(() => {
        if (!date) return;
        const mockUsers: User[] = [
            { id: 1, name: '김민준' },
            { id: 2, name: '이서연' },
            { id: 3, name: '박도윤' },
            { id: 4, name: '최지우' },
            { id: 5, name: '정하은' }
        ];

        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const attendanceData: User[] = mockUsers.map((user) => {
            const userData: User = { id: user.id, name: user.name };
            for (let i = 1; i <= daysInMonth; i++) {
                const randomStatus = attendanceStatuses[Math.floor(Math.random() * attendanceStatuses.length)].value;
                const randomProgress =
                    homeworkProgressOptions[Math.floor(Math.random() * homeworkProgressOptions.length)].value;
                userData[`day_${i}_attendance`] = randomStatus;
                userData[`day_${i}_homework`] = randomProgress;
            }
            return userData;
        });

        setUsers(attendanceData);
        scrolled.current = false; // Reset scroll flag when date changes
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
                const scrollPos = (today - 1) * dayWidth - 10;

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

    const addStudent = (): void => {
        if (!date) return;
        const newId = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;
        const newStudent: User = { id: newId, name: `학생 ${newId}` };
        const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            newStudent[`day_${i}_attendance`] = 'none';
            newStudent[`day_${i}_homework`] = 0;
        }
        setUsers([...users, newStudent]);
    };

    const removeStudent = (): void => {
        if (users.length > 0) {
            setUsers(users.slice(0, -1));
        }
    };

    // Helper function to format attendance data for saving
    const formatAttendanceData = () => {
        if (!selectedClass || !date) {
            console.warn('Cannot format data: class or date not selected.');
            return null;
        }

        const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
        const className = classes.find((cls) => cls.value === selectedClass)?.label || 'Unknown Class';

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
                userId: user.id,
                name: user.name,
                attendance: attendance
            };
        });

        return {
            classId: selectedClass,
            className: className,
            yearMonth: yearMonth,
            students: formattedStudents
        };
    };

    // 출석부 저장
    const handleSave = () => {
        const dataToSave = formatAttendanceData();
        if (dataToSave) {
            console.log('저장될 출석부 데이터:', dataToSave);
            // 여기에 실제 저장 로직 (API 호출 등)을 추가할 수 있습니다.
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

                    return <Column key={`day_${day}`} header={headerText} colSpan={2} headerStyle={style} />;
                })}
            </Row>
            <Row>
                {dayHeaders.flatMap((day: number) => [
                    <Column key={`sub_att_${day}`} header="출석" />,
                    <Column key={`sub_hw_${day}`} header="숙제" />
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
                style={{ minWidth: '150px' }}
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
                style={{ minWidth: '120px' }}
            />
        ];
    });

    return (
        <>
            <style>{`
                .p-datatable .p-datatable-thead > tr > th .p-column-header-content {
                    justify-content: center;
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
                                    onChange={(e: DropdownChangeEvent) => setSelectedClass(e.value as string)}
                                    placeholder="클래스 선택"
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
                            <div className="field col-12 md:col-6 flex align-items-end">
                                <Button
                                    icon="pi pi-plus"
                                    className="p-button-success mr-2"
                                    onClick={addStudent}
                                    tooltip="학생 추가"
                                />
                                <Button
                                    icon="pi pi-minus"
                                    className="p-button-danger"
                                    onClick={removeStudent}
                                    tooltip="마지막 학생 삭제"
                                    disabled={users.length === 0}
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
