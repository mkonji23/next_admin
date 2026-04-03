'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Calendar } from 'primereact/calendar';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Chart } from 'primereact/chart';
import { ChartData, ChartOptions } from 'chart.js';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { LayoutContext } from '@/layout/context/layoutcontext';
import { Class } from '@/types/class';
import { StatisticsSummary, StatisticsResponse } from '@/types/attendanceStatistics';
import { useContext } from 'react';

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
    const [chartData, setChartData] = useState<ChartData | null>(null);
    const [chartOptions, setChartOptions] = useState<ChartOptions | null>(null);
    const [homeworkChartData, setHomeworkChartData] = useState<ChartData | null>(null);
    const [homeworkChartOptions, setHomeworkChartOptions] = useState<ChartOptions | null>(null);
    const http = useHttp();
    const { showToast } = useToast();
    const { layoutConfig } = useContext(LayoutContext);

    useEffect(() => {
        if (statistics && statistics.classes) {
            initChart();
        }
    }, [statistics, layoutConfig]);

    const initChart = () => {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

        // 단건 조회 (클래스 선택됨)
        if (selectedClass && statistics?.classes?.length === 1) {
            const cls = statistics.classes[0];
            const stats = cls.statistics;

            // 출석 분포 Pie 차트
            const pieData: ChartData = {
                labels: ['출석', '지각', '결석'],
                datasets: [
                    {
                        data: [stats?.present || 0, stats?.late || 0, stats?.absent || 0],
                        backgroundColor: [
                            documentStyle.getPropertyValue('--green-500'),
                            documentStyle.getPropertyValue('--orange-500'),
                            documentStyle.getPropertyValue('--red-500')
                        ]
                    }
                ]
            };

            const pieOptions: ChartOptions = {
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            color: textColor
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context: any) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                                    label += `${context.parsed}회 (${percentage}%)`;
                                }
                                return label;
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: '출석 현황 분포',
                        color: textColor,
                        font: { size: 16 }
                    }
                }
            };

            // 과제 달성률 Doughnut 차트 (진척도 형태)
            const rate = stats?.homeworkRate || 0;
            const doughnutData: ChartData = {
                labels: ['달성', '미달성'],
                datasets: [
                    {
                        data: [rate, 100 - rate],
                        backgroundColor: [
                            documentStyle.getPropertyValue('--purple-500'),
                            documentStyle.getPropertyValue('--surface-200')
                        ],
                        hoverBackgroundColor: [
                            documentStyle.getPropertyValue('--purple-400'),
                            documentStyle.getPropertyValue('--surface-100')
                        ]
                    }
                ]
            };

            const doughnutOptions: ChartOptions = {
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            color: textColor
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context: any) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += `${context.parsed.toFixed(1)}%`;
                                }
                                return label;
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: `과제 달성률 (${rate.toFixed(1)}%)`,
                        color: textColor,
                        font: { size: 16 }
                    }
                }
            };

            setChartData(pieData);
            setChartOptions(pieOptions);
            setHomeworkChartData(doughnutData);
            setHomeworkChartOptions(doughnutOptions);
        } else {
            // 다건 조회 (전체 클래스) - 기존 Stacked Bar + Line
            const labels = statistics!.classes!.map((cls) => cls.className);
            const presentData = statistics!.classes!.map((cls) => cls.statistics?.present || 0);
            const absentData = statistics!.classes?.map((cls) => cls.statistics?.absent || 0);
            const lateData = statistics!.classes?.map((cls) => cls.statistics?.late || 0);
            const homeworkRates = statistics!.classes?.map((cls) => cls.statistics?.homeworkRate || 0);

            const data: ChartData = {
                labels: labels,
                datasets: [
                    {
                        type: 'bar',
                        label: '출석',
                        backgroundColor: documentStyle.getPropertyValue('--green-500'),
                        data: presentData,
                        stack: 'attendance',
                        yAxisID: 'y',
                        order: 1
                    },
                    {
                        type: 'bar',
                        label: '지각',
                        backgroundColor: documentStyle.getPropertyValue('--orange-500'),
                        data: lateData,
                        stack: 'attendance',
                        yAxisID: 'y',
                        order: 1
                    },
                    {
                        type: 'bar',
                        label: '결석',
                        backgroundColor: documentStyle.getPropertyValue('--red-500'),
                        data: absentData,
                        stack: 'attendance',
                        yAxisID: 'y',
                        order: 1
                    },
                    {
                        type: 'line',
                        label: '과제 달성률 (%)',
                        borderColor: documentStyle.getPropertyValue('--purple-500'),
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        data: homeworkRates,
                        yAxisID: 'y1',
                        order: 0
                    }
                ]
            };

            const options: ChartOptions = {
                maintainAspectRatio: false,
                aspectRatio: 0.6,
                plugins: {
                    legend: {
                        labels: {
                            color: textColor
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        ticks: {
                            color: textColorSecondary
                        },
                        grid: {
                            color: surfaceBorder
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        stacked: true,
                        ticks: {
                            color: textColorSecondary
                        },
                        grid: {
                            color: surfaceBorder
                        },
                        title: {
                            display: true,
                            text: '횟수 (회)',
                            color: textColorSecondary
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        min: 0,
                        max: 100,
                        ticks: {
                            color: textColorSecondary
                        },
                        grid: {
                            drawOnChartArea: false,
                            color: surfaceBorder
                        },
                        title: {
                            display: true,
                            text: '달성률 (%)',
                            color: textColorSecondary
                        }
                    }
                }
            };

            setChartData(data);
            setChartOptions(options);
            setHomeworkChartData(null);
        }
    };

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

        const selectedClassName = classes.find((c) => c.value === selectedClass)?.label;

        return (
            <div className="grid">
                <div className="col-12">
                    <Card style={{ border: '1px solid #dee2e6' }}>
                        {
                            <div className="mb-3 flex align-items-center gap-2">
                                <span className="text-500 text-sm">클래스:</span>
                                <span className="text-lg font-bold text-primary">{selectedClassName || '전체'}</span>
                            </div>
                        }
                        <div className="grid">
                            <div className="col-6 md:col-4 lg:col-2 flex flex-column gap-1 mb-3 text-center">
                                <span className="font-bold text-xs">총 수업 수</span>
                                <span className="text-xl font-bold">{summary.totalClasses || 0}개</span>
                            </div>
                            <div className="col-6 md:col-4 lg:col-2 flex flex-column gap-1 mb-3 text-center">
                                <span className="font-bold text-xs">총 학생 수</span>
                                <span className="text-xl font-bold">{summary.totalStudents || 0}명</span>
                            </div>
                            <div className="col-6 md:col-4 lg:col-2 flex flex-column gap-1 mb-3 text-center">
                                <span className="font-bold text-xs">총 수업일수</span>
                                <span className="text-xl font-bold">{summary.totalDays}일</span>
                            </div>
                            <div className="col-6 md:col-4 lg:col-2 flex flex-column gap-1 mb-3 text-center">
                                <span className="font-bold text-xs text-green-500">총 출석</span>
                                <span className="text-xl font-bold text-green-500">{summary.totalPresent}회</span>
                            </div>
                            <div className="col-6 md:col-4 lg:col-2 flex flex-column gap-1 mb-3 text-center">
                                <span className="font-bold text-xs text-red-500">총 결석</span>
                                <span className="text-xl font-bold text-red-500">{summary.totalAbsent}회</span>
                            </div>
                            <div className="col-6 md:col-4 lg:col-2 flex flex-column gap-1 mb-3 text-center">
                                <span className="font-bold text-xs text-orange-500">총 지각</span>
                                <span className="text-xl font-bold text-orange-500">{summary.totalLate || 0}회</span>
                            </div>
                            <div className="col-6 md:col-4 lg:col-2 flex flex-column gap-1 mb-3 text-center">
                                <span className="font-bold text-xs text-blue-500">평균 출석률</span>
                                <span className="text-xl font-bold text-blue-500">
                                    {summary.averageAttendanceRate.toFixed(1)}%
                                </span>
                            </div>
                            <div className="col-6 md:col-4 lg:col-2 flex flex-column gap-1 mb-3 text-center">
                                <span className="font-bold text-xs text-orange-500">평균 지각률</span>
                                <span className="text-xl font-bold text-orange-500">
                                    {summary.averageLateRate?.toFixed(1) || '0.0'}%
                                </span>
                            </div>
                            <div className="col-6 md:col-4 lg:col-2 flex flex-column gap-1 mb-3 text-center">
                                <span className="font-bold text-xs text-purple-500">평균 과제 달성률</span>
                                <span className="text-xl font-bold text-purple-500">
                                    {summary.averageHomeworkRate.toFixed(1)}%
                                </span>
                            </div>
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

    const lateBodyTemplate = (rowData: any) => {
        return <span className="text-orange-500 font-semibold">{rowData.statistics?.late || 0}회</span>;
    };

    const lateRateBodyTemplate = (rowData: any) => {
        const rate = rowData.statistics?.lateRate || 0;
        const severity = rate <= 5 ? 'success' : rate <= 10 ? 'warning' : 'danger';
        return <Tag value={`${rate.toFixed(1)}%`} severity={severity} />;
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
                        locale="ko"
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

                    {chartData && (
                        <div className="mb-4">
                            {homeworkChartData ? (
                                <div className="grid">
                                    <div className="col-12 md:col-6">
                                        <Card>
                                            <div className="flex justify-content-center">
                                                <Chart
                                                    type="pie"
                                                    data={chartData}
                                                    options={chartOptions || {}}
                                                    height="300px"
                                                    style={{ width: '100%', maxWidth: '300px' }}
                                                />
                                            </div>
                                        </Card>
                                    </div>
                                    <div className="col-12 md:col-6">
                                        <Card>
                                            <div className="flex justify-content-center">
                                                <Chart
                                                    type="doughnut"
                                                    data={homeworkChartData}
                                                    options={homeworkChartOptions || {}}
                                                    height="300px"
                                                    style={{ width: '100%', maxWidth: '300px' }}
                                                />
                                            </div>
                                        </Card>
                                    </div>
                                </div>
                            ) : (
                                <Card title="수업별 출석 및 과제 달성률 추이">
                                    <Chart type="bar" data={chartData} options={chartOptions || {}} height="350px" />
                                </Card>
                            )}
                        </div>
                    )}

                    {statistics.classes && statistics.classes.length > 0 && (
                        <div className="mb-4">
                            <h3>수업별 통계</h3>
                            <DataTable
                                showGridlines
                                value={statistics.classes}
                                loading={loading}
                                emptyMessage="데이터가 없습니다."
                                paginator
                                rows={30}
                            >
                                <Column
                                    field="className"
                                    header="수업명"
                                    sortable
                                    headerStyle={{ minWidth: '150px' }}
                                />
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
                                {statistics.classes[0]?.statistics?.late !== undefined && (
                                    <Column field="statistics.late" header="지각" sortable body={lateBodyTemplate} />
                                )}
                                <Column
                                    field="statistics.attendanceRate"
                                    header="출석률"
                                    sortable
                                    body={attendanceRateBodyTemplate}
                                />
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
                            </DataTable>
                        </div>
                    )}

                    {statistics.classes && statistics.classes.length > 0 && (
                        <div className="mb-4">
                            <h3>수업별 상세 통계</h3>
                            {statistics.classes.map((classItem) => (
                                <div key={classItem.classId} className="mb-4">
                                    <h4>
                                        {classItem.className} ({classItem.year}년 {classItem.month}월)
                                    </h4>
                                    <DataTable
                                        showGridlines
                                        value={classItem.students || []}
                                        loading={loading}
                                        emptyMessage="학생 데이터가 없습니다."
                                        paginator
                                        rows={10}
                                    >
                                        <Column
                                            field="name"
                                            header="학생명"
                                            sortable
                                            headerStyle={{ minWidth: '100px' }}
                                        />
                                        <Column field="grade" header="학년" sortable />
                                        <Column field="school" header="학교" sortable headerStyle={{ minWidth: '150px' }} />
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
                                        {classItem.students[0]?.statistics?.late !== undefined && (
                                            <Column
                                                field="statistics.late"
                                                header="지각"
                                                sortable
                                                body={lateBodyTemplate}
                                            />
                                        )}
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
                                        {classItem.students[0]?.statistics?.lateRate !== undefined && (
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
                            ))}
                        </div>
                    )}

                    {statistics.student && statistics.student.length > 0 && (
                        <div className="mb-4">
                            <h3>학생별 통계</h3>
                            <DataTable
                                showGridlines
                                value={statistics.student}
                                loading={loading}
                                emptyMessage="데이터가 없습니다."
                                paginator
                                rows={10}
                            >
                                <Column
                                    field="className"
                                    header="수업명"
                                    sortable
                                    headerStyle={{ minWidth: '150px' }}
                                />
                                <Column field="name" header="학생명" sortable headerStyle={{ minWidth: '100px' }} />
                                <Column field="grade" header="학년" sortable />
                                <Column field="school" header="학교" sortable headerStyle={{ minWidth: '150px' }} />
                                <Column field="statistics.present" header="출석" sortable body={presentBodyTemplate} />
                                <Column field="statistics.absent" header="결석" sortable body={absentBodyTemplate} />
                                {statistics.student[0]?.statistics?.late !== undefined && (
                                    <Column field="statistics.late" header="지각" sortable body={lateBodyTemplate} />
                                )}
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
                                {statistics.student[0]?.statistics?.lateRate !== undefined && (
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

export default AttendanceListPage;
