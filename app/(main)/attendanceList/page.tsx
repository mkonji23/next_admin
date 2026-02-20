'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Calendar } from 'primereact/calendar';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { Class } from '@/types/class';
import { StatisticsSummary, StatisticsResponse } from '@/types/attendanceStatistics';

interface ClassOption {
    label: string;
    value: string;
    classId: string;
}

const AttendanceListPage = () => {
    const [date, setDate] = useState<Date | null>(new Date());
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [statistics, setStatistics] = useState<StatisticsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const http = useHttp();
    const { showToast } = useToast();

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        if (date) {
            fetchStatistics();
        }
    }, [date, selectedClass, selectedStudentId]);

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

    const fetchStatistics = useCallback(async () => {
        if (!date) return;

        setLoading(true);
        try {
            const year = date.getFullYear().toString();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const yearMonth = `${year}${month}`;

            const params: any = {
                yearMonth: yearMonth
            };

            if (selectedClass) {
                params.classId = selectedClass;
            }

            if (selectedStudentId) {
                params.studentId = selectedStudentId;
            }

            const response = await http.get('/choiMath/attendance/getStatistics', { params });
            setStatistics(response.data || null);
        } catch (error: any) {
            console.error('Error fetching statistics:', error);
            const errorMessage = error.response?.data?.message || error.message || '통계를 불러오는데 실패했습니다.';
            showToast({ severity: 'error', summary: '조회 실패', detail: errorMessage });
            setStatistics(null);
        } finally {
            setLoading(false);
        }
    }, [date, selectedClass, selectedStudentId, http, showToast]);

    const handleClassChange = (e: DropdownChangeEvent) => {
        setSelectedClass(e.value as string);
        setSelectedStudentId(null); // 클래스 변경 시 학생 선택 초기화
    };

    const handleStudentChange = (e: DropdownChangeEvent) => {
        setSelectedStudentId(e.value as string);
    };

    const summaryBodyTemplate = (summary: StatisticsSummary | undefined) => {
        if (!summary) return null;

        return (
            <div className="grid">
                <div className="col-12 md:col-6 lg:col-3">
                    <Card>
                        <div className="flex flex-column align-items-center">
                            <span className="text-500 text-sm mb-2">총 수업일수</span>
                            <span className="text-2xl font-bold">{summary.totalDays}일</span>
                        </div>
                    </Card>
                </div>
                <div className="col-12 md:col-6 lg:col-3">
                    <Card>
                        <div className="flex flex-column align-items-center">
                            <span className="text-500 text-sm mb-2">총 출석</span>
                            <span className="text-2xl font-bold text-green-500">{summary.totalPresent}회</span>
                        </div>
                    </Card>
                </div>
                <div className="col-12 md:col-6 lg:col-3">
                    <Card>
                        <div className="flex flex-column align-items-center">
                            <span className="text-500 text-sm mb-2">총 결석</span>
                            <span className="text-2xl font-bold text-red-500">{summary.totalAbsent}회</span>
                        </div>
                    </Card>
                </div>
                <div className="col-12 md:col-6 lg:col-3">
                    <Card>
                        <div className="flex flex-column align-items-center">
                            <span className="text-500 text-sm mb-2">평균 출석률</span>
                            <span className="text-2xl font-bold text-blue-500">
                                {summary.averageAttendanceRate.toFixed(1)}%
                            </span>
                        </div>
                    </Card>
                </div>
                {summary.totalClasses !== undefined && (
                    <div className="col-12 md:col-6 lg:col-3">
                        <Card>
                            <div className="flex flex-column align-items-center">
                                <span className="text-500 text-sm mb-2">총 수업 수</span>
                                <span className="text-2xl font-bold">{summary.totalClasses}개</span>
                            </div>
                        </Card>
                    </div>
                )}
                {summary.totalStudents !== undefined && (
                    <div className="col-12 md:col-6 lg:col-3">
                        <Card>
                            <div className="flex flex-column align-items-center">
                                <span className="text-500 text-sm mb-2">총 학생 수</span>
                                <span className="text-2xl font-bold">{summary.totalStudents}명</span>
                            </div>
                        </Card>
                    </div>
                )}
                <div className="col-12 md:col-6 lg:col-3">
                    <Card>
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

    const attendanceRateBodyTemplate = (rowData: any) => {
        const rate = rowData.statistics?.attendanceRate || 0;
        const severity = rate >= 80 ? 'success' : rate >= 60 ? 'warning' : 'danger';
        return <Tag value={`${rate.toFixed(1)}%`} severity={severity} />;
    };

    const homeworkRateBodyTemplate = (rowData: any) => {
        const rate = rowData.statistics?.homeworkRate || 0;
        const severity = rate >= 80 ? 'success' : rate >= 60 ? 'warning' : 'danger';
        return <Tag value={`${rate.toFixed(1)}%`} severity={severity} />;
    };

    const presentBodyTemplate = (rowData: any) => {
        return <span className="text-green-500 font-semibold">{rowData.statistics?.present || 0}회</span>;
    };

    const absentBodyTemplate = (rowData: any) => {
        return <span className="text-red-500 font-semibold">{rowData.statistics?.absent || 0}회</span>;
    };

    return (
        <div className="card">
            <h1>출석 현황 통계</h1>

            <div className="grid formgrid p-fluid mb-3">
                <div className="field col-12 md:col-3">
                    <label htmlFor="class-selector">수업클래스 선택</label>
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

                <div className="field col-12 md:col-3 flex align-items-end">
                    <Button icon="pi pi-search" label="조회" onClick={fetchStatistics} className="w-full" />
                </div>
            </div>

            {statistics && statistics.summary && (
                <>
                    <div className="mb-4">
                        <h3>전체 통계 요약</h3>
                        {summaryBodyTemplate(statistics.summary)}
                    </div>

                    {statistics.classes && statistics.classes.length > 0 && (
                        <div className="mb-4">
                            <h3>수업별 통계</h3>
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
                                    field="statistics.totalStudents"
                                    header="학생 수"
                                    sortable
                                    body={(rowData) => rowData.statistics?.totalStudents || 0}
                                />
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
                            </DataTable>
                        </div>
                    )}

                    {statistics.classes && statistics.classes.length > 0 && (
                        <div className="mb-4">
                            <h3>학생별 상세 통계</h3>
                            {statistics.classes.map((classItem) => (
                                <div key={classItem.classId} className="mb-4">
                                    <h4>
                                        {classItem.className} ({classItem.year}년 {classItem.month}월)
                                    </h4>
                                    <DataTable
                                        value={classItem.students || []}
                                        loading={loading}
                                        emptyMessage="학생 데이터가 없습니다."
                                        paginator
                                        rows={10}
                                    >
                                        <Column field="name" header="학생명" sortable />
                                        <Column field="grade" header="학년" sortable />
                                        <Column field="school" header="학교" sortable />
                                        <Column
                                            field="statistics.present"
                                            header="출석"
                                            sortable
                                            body={presentBodyTemplate}
                                        />
                                        <Column
                                            field="statistics.absent"
                                            header="결석"
                                            sortable
                                            body={absentBodyTemplate}
                                        />
                                        <Column
                                            field="statistics.totalDays"
                                            header="수업일수"
                                            sortable
                                            body={(rowData) => rowData.statistics?.totalDays || 0}
                                        />
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
                            ))}
                        </div>
                    )}

                    {statistics.student && statistics.student.length > 0 && (
                        <div className="mb-4">
                            <h3>학생별 통계</h3>
                            <DataTable
                                value={statistics.student}
                                loading={loading}
                                emptyMessage="데이터가 없습니다."
                                paginator
                                rows={10}
                            >
                                <Column field="className" header="수업명" sortable />
                                <Column field="name" header="학생명" sortable />
                                <Column field="grade" header="학년" sortable />
                                <Column field="school" header="학교" sortable />
                                <Column field="statistics.present" header="출석" sortable body={presentBodyTemplate} />
                                <Column field="statistics.absent" header="결석" sortable body={absentBodyTemplate} />
                                <Column
                                    field="statistics.totalDays"
                                    header="수업일수"
                                    sortable
                                    body={(rowData) => rowData.statistics?.totalDays || 0}
                                />
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

export default AttendanceListPage;
