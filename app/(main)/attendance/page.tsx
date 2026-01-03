'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { Calendar } from 'primereact/calendar';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';

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

const AttendancePage = () => {
    // 2. Apply Types to State
    const [date, setDate] = useState<Date>(new Date());
    const [users, setUsers] = useState<User[]>([]);
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    // 3. Apply Types to useRef
    const dt = useRef<DataTable<any>>(null);
    const scrolled = useRef<boolean>(false);

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

    const getAttendanceSeverity = (
        status: string
    ): 'success' | 'danger' | 'info' | 'warning' | 'primary' | 'secondary' => {
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

    useEffect(() => {
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
        // 빌드용
        handleMoveToday();
    }, [users, date]);

    const handleMoveToday = (): void => {
        if (typeof window === 'undefined') {
            return; // Do not run on server
        }
        const now = new Date();
        // Only scroll if the table is showing the current month and year
        if (now.getFullYear() === date.getFullYear() && now.getMonth() === date.getMonth()) {
            const wrapper = dt.current?.getElement().querySelector('.p-datatable-wrapper');
            if (wrapper) {
                const today = now.getDate();
                const attendanceColWidth = 150;
                const homeworkColWidth = 120;
                const dayWidth = attendanceColWidth + homeworkColWidth;
                // Scroll to the column before today, so today is visible
                const scrollPos = (today - 2) * dayWidth;

                wrapper.scrollLeft = scrollPos > 0 ? scrollPos : 0;
                scrolled.current = true;
            }
        }
    };

    const onEditorValueChange = (e: DropdownChangeEvent, rowData: User, field: string): void => {
        const newUsers: User[] = users.map((user) => {
            if (user.id === rowData.id) {
                return { ...user, [field]: e.value };
            }
            return user;
        });
        setUsers(newUsers);
    };

    const attendanceEditor = (rowData: User, field: string): JSX.Element => {
        return (
            <Dropdown
                value={rowData[field]}
                options={attendanceStatuses}
                onChange={(e: DropdownChangeEvent) => onEditorValueChange(e, rowData, field)}
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

    const homeworkEditor = (rowData: User, field: string): JSX.Element => {
        return (
            <Dropdown
                value={rowData[field]}
                options={homeworkProgressOptions}
                onChange={(e: DropdownChangeEvent) => onEditorValueChange(e, rowData, field)}
                style={{ width: '100%' }}
                appendTo="self"
            />
        );
    };

    const addStudent = (): void => {
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

    const dynamicColumns: JSX.Element[] = dayHeaders.flatMap((day: number) => [
        <Column
            key={`day_${day}_attendance`}
            field={`day_${day}_attendance`}
            body={(rowData: User) => attendanceEditor(rowData, `day_${day}_attendance`)}
            style={{ minWidth: '150px' }}
        />,
        <Column
            key={`day_${day}_homework`}
            field={`day_${day}_homework`}
            body={(rowData: User) => homeworkEditor(rowData, `day_${day}_homework`)}
            style={{ minWidth: '120px' }}
        />
    ]);

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
                            scrollable
                            style={{ marginTop: '20px' }}
                        >
                            <Column
                                key="name"
                                field="name"
                                header={nameColumnHeader}
                                frozen
                                style={{ minWidth: '150px', zIndex: 1 }}
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
