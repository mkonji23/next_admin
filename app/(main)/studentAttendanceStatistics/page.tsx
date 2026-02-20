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
    const [selectedYear, setSelectedYear] = useState<Date | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [students, setStudents] = useState<StudentOption[]>([]);
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [statistics, setStatistics] = useState<StudentAttendanceStatisticsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const http = useHttp();
    const { showToast } = useToast();

    useEffect(() => {
        fetchStudents();
        fetchClasses();
    }, []);

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
            setStatistics(response.data || null);
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
                <div className="col-12 md:col-6 lg:col-3">
                    <Card style={{ border: '1px solid #dee2e6' }}>
                        <div className="flex flex-column align-items-center">
                            <span className="text-500 text-sm mb-2">평균 과제 달성율</span>
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
                        showButtonBar
                        placeholder="연도 선택"
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
                                value={statistics.classes}
                                loading={loading}
                                emptyMessage="데이터가 없습니다."
                                paginator
                                rows={10}
                            >
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
                                <Column
                                    field="statistics.attendanceRate"
                                    header="출석률"
                                    sortable
                                    body={attendanceRateBodyTemplate}
                                />
                                <Column
                                    field="statistics.homeworkRate"
                                    header="과제 달성율"
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
