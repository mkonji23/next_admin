'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { FilterMatchMode } from 'primereact/api';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { StudyTimeStatisticsItem, DailyStudyRecord } from '@/types/studyTime';
import dayjs from 'dayjs';

// 초를 "X시간 Y분 Z초" 한글 텍스트로 변환하는 헬퍼
const formatDurationText = (totalSeconds: number) => {
    if (!totalSeconds || totalSeconds <= 0) return '0초';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    const parts: string[] = [];
    if (h > 0) parts.push(`${h}시간`);
    if (m > 0) parts.push(`${m}분`);
    if (s > 0 || parts.length === 0) parts.push(`${s}초`);

    return parts.join(' ');
};

// 한국어 오전/오후 시간 포맷팅 헬퍼
const formatKoreanTime = (dt: string | Date | null | undefined) => {
    if (!dt) return '-';
    const d = dayjs(dt);
    if (!d.isValid()) return '-';
    const hour24 = d.hour();
    const ampm = hour24 < 12 ? '오전' : '오후';
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    const minute = d.format('mm');
    return `${ampm} ${hour12}:${minute}`;
};

// 학생 일자별 상세 내역 (행 확장 뷰)
const StudentDailyDetailView = ({ data }: { data: StudyTimeStatisticsItem }) => {
    return (
        <div className="p-3 surface-50 border-round-xl m-2">
            <div className="flex align-items-center justify-content-between mb-3">
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-calendar-plus text-primary text-xl" />
                    <h5 className="m-0 font-bold text-900">
                        {data.name} 학생 일자별 순공 상세 내역 ({data.dailyRecords?.length || 0}일)
                    </h5>
                </div>
                <Tag
                    severity="success"
                    value={`누적 총 ${formatDurationText(data.totalSeconds)}`}
                    className="text-sm font-bold px-3 py-1"
                />
            </div>

            <DataTable
                value={data.dailyRecords}
                emptyMessage="해당 기간 내 순공 기록이 없습니다."
                size="small"
                responsiveLayout="scroll"
                className="shadow-1 border-round-lg overflow-hidden"
            >
                <Column
                    field="date"
                    header="날짜"
                    sortable
                    body={(rowData: DailyStudyRecord) => (
                        <div className="flex align-items-center gap-2">
                            <i className="pi pi-calendar text-xs text-500" />
                            <span className="font-semibold text-700">{rowData.date}</span>
                        </div>
                    )}
                />
                <Column
                    header="최초 시작"
                    body={(rowData: DailyStudyRecord) => (
                        <span className="text-600">{formatKoreanTime(rowData.firstStartedAt)}</span>
                    )}
                />
                <Column
                    header="최종 종료"
                    body={(rowData: DailyStudyRecord) => (
                        <span className="text-600">{formatKoreanTime(rowData.lastEndedAt)}</span>
                    )}
                />
                <Column
                    field="sessionsCount"
                    header="집중 세션수"
                    sortable
                    body={(rowData: DailyStudyRecord) => (
                        <span className="font-semibold text-primary">{rowData.sessionsCount || 0}회</span>
                    )}
                />
                <Column
                    field="totalSeconds"
                    header="공부시간"
                    sortable
                    body={(rowData: DailyStudyRecord) => (
                        <Tag
                            severity="info"
                            value={formatDurationText(rowData.totalSeconds)}
                            className="font-bold text-xs"
                        />
                    )}
                />
            </DataTable>
        </div>
    );
};

const StudyTimeStatisticsPage = () => {
    const [statistics, setStatistics] = useState<StudyTimeStatisticsItem[]>([]);
    const [startDate, setStartDate] = useState<Date>(dayjs().startOf('month').toDate());
    const [endDate, setEndDate] = useState<Date>(dayjs().endOf('month').toDate());
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [expandedRows, setExpandedRows] = useState<any>({});
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');

    const http = useHttp();
    const { showToast } = useToast();

    useEffect(() => {
        fetchStudents();
        fetchClasses();
        fetchStudyTimeStatistics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await http.get('/choiMath/student/getStudentList');
            const studentOptions = (response.data || []).map((s: any) => ({
                label: s.name,
                value: s.studentId
            }));
            setStudents(studentOptions);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await http.get('/choiMath/class/');
            setClasses(response.data || []);
        } catch (error) {
            showToast({
                severity: 'error',
                summary: '조회 실패',
                detail: '클래스 목록을 불러오는데 실패했습니다.'
            });
        }
    };

    const fetchStudyTimeStatistics = async () => {
        setLoading(true);
        try {
            const dateFrom = dayjs(startDate).format('YYYY-MM-DD');
            const dateTo = dayjs(endDate).format('YYYY-MM-DD');

            const params: any = {
                dateFrom,
                dateTo
            };

            if (selectedStudent) {
                params.studentId = selectedStudent;
            }

            if (selectedClass) {
                params.classId = selectedClass;
            }

            const response = await http.get('/choiMath/studyTime/getStatistics', { params });
            const data = response.data || [];
            setStatistics(data);
            setExpandedRows({});
        } catch (error: any) {
            console.error('Error fetching study time statistics:', error);
            showToast({
                severity: 'error',
                summary: '조회 실패',
                detail: error.response?.data?.message || '공부시간 통계 데이터를 불러오는데 실패했습니다.'
            });
        } finally {
            setLoading(false);
        }
    };

    const onSearch = () => {
        fetchStudyTimeStatistics();
    };

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const _filters = { ...filters };

        // @ts-ignore
        _filters['global'].value = value;

        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    // 상단 요약 지표 계산
    const summaryStats = useMemo(() => {
        if (!statistics || statistics.length === 0) {
            return {
                totalSecondsSum: 0,
                activeStudentsCount: 0,
                totalSessionsSum: 0,
                topStudent: null
            };
        }

        const activeList = statistics.filter((s) => s.totalSeconds > 0);
        const totalSecondsSum = activeList.reduce((acc, cur) => acc + (cur.totalSeconds || 0), 0);
        const totalSessionsSum = activeList.reduce((acc, cur) => acc + (cur.totalSessionsCount || 0), 0);
        const topStudent = activeList.length > 0 ? activeList[0] : null;

        return {
            totalSecondsSum,
            activeStudentsCount: activeList.length,
            totalSessionsSum,
            topStudent
        };
    }, [statistics]);

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-2">
            <div className="flex align-items-center gap-3">
                <h5 className="m-0 font-bold">학생별 공부시간 순위 및 통계</h5>
                <span className="text-400 text-sm italic">
                    <i className="pi pi-info-circle mr-1" />
                    행의 화살표를 클릭하여 일자별 상세 내역을 확인하세요.
                </span>
            </div>
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText
                    type="search"
                    value={globalFilterValue}
                    onChange={onGlobalFilterChange}
                    placeholder="이름, 학교, 학년 검색"
                    className="p-inputtext-sm"
                />
            </span>
        </div>
    );

    return (
        <div className="grid">
            {/* 상단 조회 조건 필터 카드 */}
            <div className="col-12">
                <div className="card shadow-2 border-round-2xl">
                    <h5 className="font-bold text-lg mb-3">조회 조건</h5>
                    <div className="flex flex-wrap gap-3 align-items-end">
                        <div className="flex flex-column gap-2">
                            <label className="font-bold text-sm text-700">조회 기간 (시작)</label>
                            <Calendar
                                value={startDate}
                                onChange={(e) => setStartDate(e.value as Date)}
                                dateFormat="yy-mm-dd"
                                placeholder="시작일"
                                showIcon
                                locale="ko"
                                appendTo="self"
                                showButtonBar
                            />
                        </div>
                        <div className="flex flex-column gap-2">
                            <label className="font-bold text-sm text-700">조회 기간 (종료)</label>
                            <Calendar
                                value={endDate}
                                onChange={(e) => setEndDate(e.value as Date)}
                                dateFormat="yy-mm-dd"
                                placeholder="종료일"
                                showIcon
                                locale="ko"
                                appendTo="self"
                                showButtonBar
                                minDate={startDate}
                            />
                        </div>
                        <div className="flex flex-column gap-2">
                            <label htmlFor="studentSelect" className="font-bold text-sm text-700">
                                학생 선택
                            </label>
                            <Dropdown
                                id="studentSelect"
                                value={selectedStudent}
                                options={students}
                                onChange={(e) => setSelectedStudent(e.value)}
                                placeholder="전체 학생"
                                showClear
                                filter
                                style={{ minWidth: '180px' }}
                            />
                        </div>
                        <div className="flex flex-column gap-2">
                            <label htmlFor="classSelect" className="font-bold text-sm text-700">
                                클래스 선택
                            </label>
                            <Dropdown
                                id="classSelect"
                                value={selectedClass}
                                options={classes}
                                optionLabel="className"
                                optionValue="classId"
                                onChange={(e) => setSelectedClass(e.value)}
                                placeholder="전체 클래스"
                                showClear
                                filter
                                style={{ minWidth: '180px' }}
                            />
                        </div>
                        <Button
                            label="조회"
                            icon="pi pi-search"
                            onClick={onSearch}
                            loading={loading}
                            className="p-button-primary font-bold px-4"
                        />
                    </div>
                </div>
            </div>

            {/* 중간 핵심 요약 지표 카드 */}
            <div className="col-12 md:col-3">
                <div className="card shadow-1 border-round-xl mb-0 flex align-items-center justify-content-between p-3 surface-card border-left-3 border-green-500">
                    <div>
                        <span className="block text-500 font-medium mb-1 text-sm">기간 내 총 공부시간</span>
                        <div className="text-900 font-bold text-xl">
                            {formatDurationText(summaryStats.totalSecondsSum)}
                        </div>
                    </div>
                    <div className="w-3rem h-3rem bg-green-100 border-circle flex align-items-center justify-content-center">
                        <i className="pi pi-stopwatch text-green-600 text-xl" />
                    </div>
                </div>
            </div>
            <div className="col-12 md:col-3">
                <div className="card shadow-1 border-round-xl mb-0 flex align-items-center justify-content-between p-3 surface-card border-left-3 border-blue-500">
                    <div>
                        <span className="block text-500 font-medium mb-1 text-sm">공부 참여 학생 수</span>
                        <div className="text-900 font-bold text-xl">{summaryStats.activeStudentsCount}명</div>
                    </div>
                    <div className="w-3rem h-3rem bg-blue-100 border-circle flex align-items-center justify-content-center">
                        <i className="pi pi-users text-blue-600 text-xl" />
                    </div>
                </div>
            </div>
            <div className="col-12 md:col-3">
                <div className="card shadow-1 border-round-xl mb-0 flex align-items-center justify-content-between p-3 surface-card border-left-3 border-orange-500">
                    <div>
                        <span className="block text-500 font-medium mb-1 text-sm">총 집중 세션수</span>
                        <div className="text-900 font-bold text-xl">{summaryStats.totalSessionsSum}회</div>
                    </div>
                    <div className="w-3rem h-3rem bg-orange-100 border-circle flex align-items-center justify-content-center">
                        <i className="pi pi-bolt text-orange-600 text-xl" />
                    </div>
                </div>
            </div>
            <div className="col-12 md:col-3">
                <div className="card shadow-1 border-round-xl mb-0 flex align-items-center justify-content-between p-3 surface-card border-left-3 border-yellow-500">
                    <div>
                        <span className="block text-500 font-medium mb-1 text-sm">👑 1위 집중왕</span>
                        <div className="text-900 font-bold text-xl text-overflow-ellipsis overflow-hidden white-space-nowrap" style={{ maxWidth: '140px' }}>
                            {summaryStats.topStudent ? summaryStats.topStudent.name : '-'}
                        </div>
                    </div>
                    <div className="w-3rem h-3rem bg-yellow-100 border-circle flex align-items-center justify-content-center">
                        <i className="pi pi-trophy text-yellow-600 text-xl" />
                    </div>
                </div>
            </div>

            {/* 하단 메인 순공시간 데이터 테이블 */}
            <div className="col-12">
                <div className="card shadow-2 border-round-2xl">
                    <DataTable
                        value={statistics}
                        expandedRows={expandedRows}
                        onRowToggle={(e) => setExpandedRows(e.data)}
                        rowExpansionTemplate={(rowData) => <StudentDailyDetailView data={rowData} />}
                        dataKey="studentId"
                        emptyMessage="조회된 공부시간 데이터가 없습니다."
                        header={header}
                        paginator
                        rows={10}
                        rowsPerPageOptions={[10, 20, 50]}
                        filters={filters}
                        globalFilterFields={['name', 'school', 'grade', 'className']}
                        sortField="totalSeconds"
                        sortOrder={-1}
                        responsiveLayout="scroll"
                    >
                        <Column expander style={{ width: '3.5rem' }} />
                        <Column
                            header="순위"
                            body={(rowData: StudyTimeStatisticsItem) => {
                                const rank = rowData.rank;
                                if (!rank || rank <= 0 || rowData.totalSeconds <= 0) {
                                    return <span className="text-400 font-normal">-</span>;
                                }

                                let color = '#64748b';
                                let trophyIcon: React.ReactNode = null;

                                if (rank === 1) {
                                    color = '#eab308';
                                    trophyIcon = <i className="pi pi-trophy text-yellow-500 text-xl" />;
                                } else if (rank === 2) {
                                    color = '#94a3b8';
                                    trophyIcon = <i className="pi pi-trophy text-gray-400 text-lg" />;
                                } else if (rank === 3) {
                                    color = '#d97706';
                                    trophyIcon = <i className="pi pi-trophy text-orange-500 text-base" />;
                                }

                                return (
                                    <div className="flex align-items-center gap-2">
                                        {trophyIcon}
                                        <span className="font-extrabold text-base" style={{ color }}>
                                            {rank}위
                                        </span>
                                    </div>
                                );
                            }}
                            sortable
                            sortField="rank"
                            style={{ width: '6rem' }}
                        />
                        <Column
                            field="name"
                            header="학생 이름"
                            sortable
                            headerStyle={{ minWidth: '120px' }}
                            body={(rowData: StudyTimeStatisticsItem) => (
                                <span className="font-bold text-900">{rowData.name}</span>
                            )}
                        />
                        <Column
                            field="school"
                            header="학교"
                            sortable
                            body={(rowData: StudyTimeStatisticsItem) => rowData.school || '-'}
                        />
                        <Column
                            field="grade"
                            header="학년"
                            sortable
                            body={(rowData: StudyTimeStatisticsItem) => {
                                if (!rowData.grade) return '-';
                                return String(rowData.grade).includes('학년')
                                    ? rowData.grade
                                    : `${rowData.grade}학년`;
                            }}
                        />
                        <Column
                            field="totalSeconds"
                            header="총 공부시간"
                            sortable
                            body={(rowData: StudyTimeStatisticsItem) => (
                                <div className="flex align-items-center gap-2">
                                    <span className="font-bold text-green-600 text-base">
                                        {formatDurationText(rowData.totalSeconds)}
                                    </span>
                                </div>
                            )}
                        />
                        <Column
                            field="studyDaysCount"
                            header="공부 일수"
                            sortable
                            body={(rowData: StudyTimeStatisticsItem) => (
                                <span className="text-700 font-semibold">{rowData.studyDaysCount || 0}일</span>
                            )}
                        />
                        <Column
                            field="totalSessionsCount"
                            header="총 집중 세션수"
                            sortable
                            body={(rowData: StudyTimeStatisticsItem) => (
                                <span className="text-700 font-semibold">{rowData.totalSessionsCount || 0}회</span>
                            )}
                        />
                        <Column
                            field="averageSecondsPerDay"
                            header="일 평균 순공"
                            sortable
                            body={(rowData: StudyTimeStatisticsItem) => (
                                <span className="text-600 text-sm">
                                    {formatDurationText(rowData.averageSecondsPerDay)}
                                </span>
                            )}
                        />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default StudyTimeStatisticsPage;
