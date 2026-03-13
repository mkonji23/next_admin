'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { Student } from '@/types/class';
import {
    StudentStatisticsSummary,
    StudentClassStatistics,
    StudentAttendanceStatisticsResponse
} from '@/types/attendanceStatistics';
import {
    ATTENDANCE_STATUS_OPTIONS,
    getAttendanceSeverity,
    getHomeworkSeverity,
    HOMEWORK_PROGRESS_OPTIONS
} from '@/constants/attendance';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
interface StudentOption {
    label: string;
    value: string;
    studentId: string;
}

interface ClassOption {
    label: string;
    value: string;
    classId: string;
}

const StudentAttendanceStatisticsPage = () => {
    dayjs.locale('ko');
    const [selectedYear, setSelectedYear] = useState<Date | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [students, setStudents] = useState<StudentOption[]>([]);
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [statistics, setStatistics] = useState<StudentAttendanceStatisticsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [expandedRows, setExpandedRows] = useState<any>({});
    const http = useHttp();
    const { showToast } = useToast();

    useEffect(() => {
        fetchStudents();
        fetchClasses();
    }, []);

    const rowExpansionTemplate = (tdata: StudentClassStatistics) => {
        console.log('tdata', tdata);
        const data = { ...tdata, attendance: tdata.attendance?.filter((item) => item.status !== 'none') };
        return (
            <div className="p-3">
                <h5>{data.className} 상세 출석 내역</h5>
                <DataTable value={data?.attendance} showGridlines>
                    <Column header="No." body={(data, options) => options.rowIndex + 1} style={{ width: '3rem' }} />
                    <Column
                        style={{ width: '25%' }}
                        field="date"
                        header="날짜"
                        body={(rowData) => {
                            const dateStr = rowData.date;
                            const dt = dayjs(dateStr);
                            const formatDt = dt.format('YYYY-MM-DD (dd)');
                            const day = dt.day();
                            const colorClass = day === 0 ? 'text-red-500' : day === 6 ? 'text-blue-500' : '';

                            return <span className={colorClass}>{formatDt}</span>;
                        }}
                        sortable
                    />
                    <Column
                        field="status"
                        header="출석"
                        body={(rowData) => {
                            const option = ATTENDANCE_STATUS_OPTIONS.find((opt) => opt.value === rowData.status);
                            const label = option ? option.label : rowData.status;
                            const severity = getAttendanceSeverity(rowData.status);
                            return <Tag value={label} severity={severity} />;
                        }}
                        sortable
                    />
                    <Column
                        field="homework"
                        header="숙제"
                        body={(rowData) => {
                            // homework 값이 0, 1, 2 등으로 들어올 경우 대비 (1: 100%, 2: 50%, 0: 0%)
                            let progress = rowData.homework;
                            if (progress === 1) progress = 100;
                            else if (progress === 2) progress = 50;

                            const option = HOMEWORK_PROGRESS_OPTIONS.find((opt) => opt.value === progress);
                            const label = option ? option.label : `${progress}%`;
                            const severity = getHomeworkSeverity(progress);
                            return <Tag value={label} severity={severity} />;
                        }}
                        sortable
                    />
                    <Column field="note" header="비고" />
                </DataTable>
            </div>
        );
    };

    const fetchStudents = async () => {
        try {
            const response = await http.get('/choiMath/student/getStudentList');
            const studentOptions: StudentOption[] = (response.data || []).map((student: Student) => {
                const gradeText = student.grade ? `${student.grade}학년` : '';
                const schoolText = student.school || '';
                const additionalInfo = [gradeText, schoolText].filter(Boolean).join(' / ');
                const label = additionalInfo
                    ? `${student.name} (${additionalInfo})`
                    : `${student.name} (${student.studentId})`;

                return {
                    label: label,
                    value: student.studentId,
                    studentId: student.studentId
                };
            });
            setStudents(studentOptions);
        } catch (error) {
            console.error('Error fetching students:', error);
            showToast({ severity: 'error', summary: '조회 실패', detail: '학생 목록을 불러오는데 실패했습니다.' });
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await http.get('/choiMath/class/');
            const classOptions: ClassOption[] = (response.data || []).map((cls: any) => ({
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

    const fetchStatistics = useCallback(async () => {
        if (!selectedStudentId) return;

        setLoading(true);
        try {
            const params: any = {
                studentId: selectedStudentId
            };

            if (selectedYear) {
                const year = selectedYear.getFullYear().toString();
                params.year = year;
            }

            if (selectedMonth) {
                const month = String(selectedMonth.getMonth() + 1).padStart(2, '0');
                params.month = month;
            }

            // year와 month가 모두 있으면 yearMonth도 추가
            if (selectedYear && selectedMonth) {
                const year = selectedYear.getFullYear().toString();
                const month = String(selectedMonth.getMonth() + 1).padStart(2, '0');
                params.yearMonth = `${year}${month}`;
            }

            if (selectedClass) {
                params.classId = selectedClass;
            }

            const response = await http.get('/choiMath/attendance/getStudentStatistics', { params });
            const data = response.data || null;

            if (data && data.classes) {
                // Unique ID 생성 (TypeScript 에러 해결 및 row expansion 정상 작동을 위함)
                data.classes = data.classes.map((cls: StudentClassStatistics) => ({
                    ...cls,
                    id: `${cls.classId}-${cls.year}-${cls.month}`
                }));
            }

            setStatistics(data);
        } catch (error: any) {
            console.error('Error fetching statistics:', error);
            const errorMessage = error.response?.data?.message || error.message || '통계를 불러오는데 실패했습니다.';
            showToast({ severity: 'error', summary: '조회 실패', detail: errorMessage });
            setStatistics(null);
        } finally {
            setLoading(false);
        }
    }, [selectedYear, selectedMonth, selectedStudentId, selectedClass, http, showToast]);

    const handleStudentChange = (e: DropdownChangeEvent) => {
        setSelectedStudentId(e.value as string);
    };

    const handleClassChange = (e: DropdownChangeEvent) => {
        setSelectedClass(e.value as string);
    };

    const summaryBodyTemplate = (summary: StudentStatisticsSummary) => {
        if (!summary) return null;

        return (
            <div className="grid">
                <div className="col-12">
                    <Card style={{ border: '1px solid #dee2e6' }}>
                        <div className="flex flex-column gap-2">
                            <div className="flex align-items-center gap-2">
                                <span className="text-500 text-sm">학생명:</span>
                                <span className="text-lg font-bold">{summary.studentName || '-'}</span>
                            </div>
                            {summary.studentGrade && (
                                <div className="flex align-items-center gap-2">
                                    <span className="text-500 text-sm">학년:</span>
                                    <span className="text-lg">{summary.studentGrade}</span>
                                </div>
                            )}
                            {summary.studentSchool && (
                                <div className="flex align-items-center gap-2">
                                    <span className="text-500 text-sm">학교:</span>
                                    <span className="text-lg">{summary.studentSchool}</span>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
                <div className="col-12 md:col-6 lg:col-3">
                    <Card style={{ border: '1px solid #dee2e6' }}>
                        <div className="flex flex-column align-items-center">
                            <span className="text-500 text-sm mb-2">총 수업 수</span>
                            <span className="text-2xl font-bold">{summary.totalClasses}개</span>
                        </div>
                    </Card>
                </div>
                <div className="col-12 md:col-6 lg:col-3">
                    <Card style={{ border: '1px solid #dee2e6' }}>
                        <div className="flex flex-column align-items-center">
                            <span className="text-500 text-sm mb-2">총 수업일수</span>
                            <span className="text-2xl font-bold">{summary.totalDays}일</span>
                        </div>
                    </Card>
                </div>
                <div className="col-12 md:col-6 lg:col-3">
                    <Card style={{ border: '1px solid #dee2e6' }}>
                        <div className="flex flex-column align-items-center">
                            <span className="text-500 text-sm mb-2">총 출석</span>
                            <span className="text-2xl font-bold text-green-500">{summary.totalPresent}회</span>
                        </div>
                    </Card>
                </div>
                <div className="col-12 md:col-6 lg:col-3">
                    <Card style={{ border: '1px solid #dee2e6' }}>
                        <div className="flex flex-column align-items-center">
                            <span className="text-500 text-sm mb-2">총 결석</span>
                            <span className="text-2xl font-bold text-red-500">{summary.totalAbsent}회</span>
                        </div>
                    </Card>
                </div>
                {summary.totalLate !== undefined && (
                    <div className="col-12 md:col-6 lg:col-3">
                        <Card style={{ border: '1px solid #dee2e6' }}>
                            <div className="flex flex-column align-items-center">
                                <span className="text-500 text-sm mb-2">총 지각</span>
                                <span className="text-2xl font-bold text-orange-500">{summary.totalLate}회</span>
                            </div>
                        </Card>
                    </div>
                )}
                <div className="col-12 md:col-6 lg:col-3">
                    <Card style={{ border: '1px solid #dee2e6' }}>
                        <div className="flex flex-column align-items-center">
                            <span className="text-500 text-sm mb-2">평균 출석률</span>
                            <span className="text-2xl font-bold text-blue-500">
                                {summary.averageAttendanceRate.toFixed(1)}%
                            </span>
                        </div>
                    </Card>
                </div>
                {summary.averageAbsentRate !== undefined && (
                    <div className="col-12 md:col-6 lg:col-3">
                        <Card style={{ border: '1px solid #dee2e6' }}>
                            <div className="flex flex-column align-items-center">
                                <span className="text-500 text-sm mb-2">평균 결석률</span>
                                <span className="text-2xl font-bold text-red-500">
                                    {summary.averageAbsentRate.toFixed(1)}%
                                </span>
                            </div>
                        </Card>
                    </div>
                )}
                {summary.averageLateRate !== undefined && (
                    <div className="col-12 md:col-6 lg:col-3">
                        <Card style={{ border: '1px solid #dee2e6' }}>
                            <div className="flex flex-column align-items-center">
                                <span className="text-500 text-sm mb-2">평균 지각률</span>
                                <span className="text-2xl font-bold text-orange-500">
                                    {summary.averageLateRate.toFixed(1)}%
                                </span>
                            </div>
                        </Card>
                    </div>
                )}
                <div className="col-12 md:col-6 lg:col-3">
                    <Card style={{ border: '1px solid #dee2e6' }}>
                        <div className="flex flex-column align-items-center">
                            <span className="text-500 text-sm mb-2">평균 과제 달성률</span>
                            <span className="text-2xl font-bold text-purple-500">
                                {summary.averageHomeworkRate.toFixed(1)}%
                            </span>
                        </div>
                    </Card>
                </div>
            </div>
        );
    };

    const attendanceRateBodyTemplate = (rowData: StudentClassStatistics) => {
        const rate = rowData.statistics?.attendanceRate || 0;
        const severity = rate >= 80 ? 'success' : rate >= 60 ? 'warning' : 'danger';
        return <Tag value={`${rate.toFixed(1)}%`} severity={severity} />;
    };

    const homeworkRateBodyTemplate = (rowData: StudentClassStatistics) => {
        const rate = rowData.statistics?.homeworkRate || 0;
        const severity = rate >= 80 ? 'success' : rate >= 60 ? 'warning' : 'danger';
        return <Tag value={`${rate.toFixed(1)}%`} severity={severity} />;
    };

    const presentBodyTemplate = (rowData: StudentClassStatistics) => {
        return <span className="text-green-500 font-semibold">{rowData.statistics?.present || 0}회</span>;
    };

    const absentBodyTemplate = (rowData: StudentClassStatistics) => {
        return <span className="text-red-500 font-semibold">{rowData.statistics?.absent || 0}회</span>;
    };

    const lateBodyTemplate = (rowData: StudentClassStatistics) => {
        return <span className="text-orange-500 font-semibold">{rowData.statistics?.late || 0}회</span>;
    };

    const absentRateBodyTemplate = (rowData: StudentClassStatistics) => {
        const rate = rowData.statistics?.absentRate || 0;
        const severity = rate <= 5 ? 'success' : rate <= 10 ? 'warning' : 'danger';
        return <Tag value={`${rate.toFixed(1)}%`} severity={severity} />;
    };

    const lateRateBodyTemplate = (rowData: StudentClassStatistics) => {
        const rate = rowData.statistics?.lateRate || 0;
        const severity = rate <= 5 ? 'success' : rate <= 10 ? 'warning' : 'danger';
        return <Tag value={`${rate.toFixed(1)}%`} severity={severity} />;
    };

    return (
        <div className="card">
            <h1>학생별 출석현황 통계</h1>

            <div className="grid formgrid p-fluid mb-3">
                <div className="field col-12 md:col-3">
                    <label htmlFor="student-selector">
                        학생 선택 <span className="text-red-500">*</span>
                    </label>
                    <Dropdown
                        id="student-selector"
                        value={selectedStudentId}
                        options={students}
                        onChange={handleStudentChange}
                        placeholder="학생 선택"
                        optionLabel="label"
                        optionValue="value"
                        showClear
                        filter
                        filterBy="label"
                    />
                </div>
                <div className="field col-12 md:col-3">
                    <label htmlFor="class-selector">수업클래스 선택 (선택사항)</label>
                    <Dropdown
                        id="class-selector"
                        value={selectedClass}
                        options={classes}
                        onChange={handleClassChange}
                        placeholder="전체 클래스"
                        optionLabel="label"
                        optionValue="value"
                        showClear
                    />
                </div>
                <div className="field col-12 md:col-2">
                    <label htmlFor="year-picker">연도 (선택사항)</label>
                    <Calendar
                        id="year-picker"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.value as Date)}
                        view="year"
                        dateFormat="yy"
                        showIcon
                        placeholder="연도 선택"
                        appendTo="self"
                    />
                </div>
                <div className="field col-12 md:col-2">
                    <label htmlFor="month-picker">월 (선택사항)</label>
                    <Calendar
                        id="month-picker"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.value as Date)}
                        view="month"
                        dateFormat="mm"
                        showIcon
                        showButtonBar
                        placeholder="월 선택"
                        appendTo="self"
                    />
                </div>
                <div className="field col-6 md:col-2 flex align-items-end">
                    <Button
                        icon="pi pi-search"
                        label="조회"
                        onClick={fetchStatistics}
                        className="w-full"
                        disabled={!selectedStudentId}
                    />
                </div>
            </div>

            {statistics && statistics.summary && (
                <>
                    <div className="mb-4">
                        <h3>학생 정보 및 전체 통계 요약</h3>
                        {summaryBodyTemplate(statistics.summary)}
                    </div>

                    {statistics.classes && statistics.classes.length > 0 && (
                        <div className="mb-4">
                            <h3>수업별 상세 통계</h3>
                            <DataTable
                                showGridlines
                                value={statistics.classes}
                                loading={loading}
                                emptyMessage="데이터가 없습니다."
                                paginator
                                rows={10}
                                expandedRows={expandedRows}
                                onRowToggle={(e) => setExpandedRows(e.data)}
                                rowExpansionTemplate={rowExpansionTemplate}
                                dataKey="id"
                            >
                                <Column header="No." body={(data, options) => options.rowIndex + 1} style={{ width: '3rem' }} />
                                <Column expander={true} style={{ width: '3rem' }} />
                                <Column field="className" header="수업명" sortable />
                                <Column field="year" header="연도" sortable />
                                <Column field="month" header="월" sortable />
                                <Column
                                    field="statistics.totalDays"
                                    header="수업일수"
                                    sortable
                                    body={(rowData) => rowData.statistics?.totalDays || 0}
                                />
                                <Column field="statistics.present" header="출석" sortable body={presentBodyTemplate} />
                                <Column field="statistics.absent" header="결석" sortable body={absentBodyTemplate} />
                                {statistics.classes[0]?.statistics?.late !== undefined && (
                                    <Column field="statistics.late" header="지각" sortable body={lateBodyTemplate} />
                                )}
                                <Column
                                    field="statistics.attendanceRate"
                                    header="출석률"
                                    sortable
                                    body={attendanceRateBodyTemplate}
                                />
                                {statistics.classes[0]?.statistics?.absentRate !== undefined && (
                                    <Column
                                        field="statistics.absentRate"
                                        header="결석률"
                                        sortable
                                        body={absentRateBodyTemplate}
                                    />
                                )}
                                {statistics.classes[0]?.statistics?.lateRate !== undefined && (
                                    <Column
                                        field="statistics.lateRate"
                                        header="지각률"
                                        sortable
                                        body={lateRateBodyTemplate}
                                    />
                                )}
                                <Column
                                    field="statistics.homeworkRate"
                                    header="과제 달성률"
                                    sortable
                                    body={homeworkRateBodyTemplate}
                                />
                                <Column
                                    field="statistics.homeworkCount"
                                    header="과제 완료 수"
                                    sortable
                                    body={(rowData) => rowData.statistics?.homeworkCount || 0}
                                />
                            </DataTable>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default StudentAttendanceStatisticsPage;
