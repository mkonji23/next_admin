'use client';

import React, { useState, useEffect } from 'react';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { PraiseClass, PraiseDetail, PraiseStatistics } from '@/types/attendanceStatistics';
import dayjs from 'dayjs';
import { Tag } from 'primereact/tag';
import { FilterMatchMode } from 'primereact/api';
import { ATTENDANCE_STATUS_OPTIONS } from '@/constants/attendance';

const PraiseClassDataTable = ({ data }: { data: PraiseClass }) => {
    const filterAttendance = data?.attendance?.filter((item) => item.praise);

    const getAttendanceSeverity = (status: string) => {
        switch (status) {
            case 'class_present':
                return 'success';
            case 'class_absent':
                return 'danger';
            case 'late':
                return 'warning';
            default:
                return 'info';
        }
    };

    return (
        <div className="p-3">
            <DataTable value={filterAttendance} emptyMessage="칭찬 내역이 없습니다.">
                <Column
                    field="date"
                    header="날짜"
                    sortable
                    body={(rowData: PraiseDetail) => dayjs(rowData?.date).format('YYYY-MM-DD')}
                />
                <Column
                    field="status"
                    header="출석상태"
                    body={(rowData: PraiseDetail) => (
                        <Tag
                            value={ATTENDANCE_STATUS_OPTIONS.find((opt) => opt.value === rowData.status)?.label || '없음'}
                            severity={getAttendanceSeverity(rowData.status || '') as any}
                        />
                    )}
                />
                <Column field="homework" header="숙제" body={(rowData) => `${rowData?.homework || 0}%`} />
                <Column
                    field="praise"
                    header="칭찬여부"
                    body={(rowData) =>
                        rowData.praise ? (
                            <i className="pi pi-face-smile text-green-500 text-2xl" />
                        ) : (
                            <i className="pi pi-minus text-400" />
                        )
                    }
                />
            </DataTable>
        </div>
    );
};

const StudentDetailView = ({ data }: { data: PraiseStatistics }) => {
    const [expandedRows, setExpandedRows] = useState<any>({});

    return (
        <div className="p-3">
            <h5>{data.name} 학생 상세 내역</h5>
            <DataTable
                value={data?.classes}
                expandedRows={expandedRows}
                onRowToggle={(e) => setExpandedRows(e.data)}
                rowExpansionTemplate={(rowData) => <PraiseClassDataTable data={rowData} />}
                dataKey="classId"
                emptyMessage="관련 클래스 정보가 없습니다."
            >
                <Column expander style={{ width: '3em' }} />
                <Column
                    field="className"
                    header="클래스명"
                    sortable
                    body={(rowData: PraiseClass) => rowData.className}
                    headerStyle={{ minWidth: '150px' }}
                />
            </DataTable>
        </div>
    );
};

const PraiseStatisticsPage = () => {
    const [statistics, setStatistics] = useState<PraiseStatistics[]>([]);
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
        fetchPraiseStatistics();
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
            setClasses(response.data);
        } catch (error) {
            showToast({
                severity: 'error',
                summary: '조회 실패',
                detail: '클래스 목록을 불러오는데 실패했습니다.'
            });
        }
    };

    const fetchPraiseStatistics = async () => {
        setLoading(true);
        try {
            const dateFrom = dayjs(startDate).format('YYYYMMDD');
            const dateTo = dayjs(endDate).format('YYYYMMDD');

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

            const response = await http.get('/choiMath/attendance/getPraiseStatistics', { params });
            const formattedData = (response.data || []).map((item: any) => ({
                ...item,
                uniqueKey: `${item.name}_${item.grade}_${item.class || item.className || ''}`
            }));
            setStatistics(formattedData);
            setExpandedRows({}); // 새로운 조회 시 확장 상태 초기화
        } catch (error: any) {
            console.error('Error fetching praise statistics:', error);
            showToast({
                severity: 'error',
                summary: '조회 실패',
                detail: error.response?.data?.message || '통계 데이터를 불러오는데 실패했습니다.'
            });
        } finally {
            setLoading(false);
        }
    };

    const onSearch = () => {
        fetchPraiseStatistics();
    };

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };

        // @ts-ignore
        _filters['global'].value = value;

        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const getRank = (praiseCount: number) => {
        if (!statistics || statistics.length === 0) return 0;
        const sortedUniqueCounts = Array.from(new Set(statistics.map((s) => s.totalPraiseCnt))).sort((a, b) => b - a);
        return sortedUniqueCounts.indexOf(praiseCount) + 1;
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-2">
            <div className="flex align-items-center gap-3">
                <h5 className="m-0">칭찬 통계 목록</h5>
                <span className="text-400 text-sm italic">
                    <i className="pi pi-info-circle mr-2" />
                    행을 클릭하여 상세 내역을 확인하세요.
                </span>
            </div>
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText
                    type="search"
                    value={globalFilterValue}
                    onChange={onGlobalFilterChange}
                    placeholder="목록 내 이름 검색"
                    className="p-inputtext-sm"
                />
            </span>
        </div>
    );

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <h5>조회 조건</h5>
                    <div className="flex flex-wrap gap-3 align-items-end">
                        <div className="flex flex-column gap-2">
                            <label className="font-bold text-sm">조회 기간 (시작)</label>
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
                            <label className="font-bold text-sm">조회 기간 (종료)</label>
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
                            <label htmlFor="studentSelect" className="font-bold text-sm">
                                학생 선택
                            </label>
                            <Dropdown
                                id="studentSelect"
                                value={selectedStudent}
                                options={students}
                                onChange={(e) => setSelectedStudent(e.value)}
                                placeholder="학생 선택"
                                showClear
                                style={{ minWidth: '180px' }}
                            />
                        </div>
                        <div className="flex flex-column gap-2">
                            <label htmlFor="classSelect" className="font-bold text-sm">
                                클래스 선택
                            </label>
                            <Dropdown
                                id="classSelect"
                                value={selectedClass}
                                options={classes}
                                optionLabel="className"
                                optionValue="classId"
                                onChange={(e) => setSelectedClass(e.value)}
                                placeholder="클래스 선택"
                                showClear
                                style={{ minWidth: '180px' }}
                            />
                        </div>
                        <Button
                            label="조회"
                            icon="pi pi-search"
                            onClick={onSearch}
                            loading={loading}
                            className="p-button-primary"
                        />
                    </div>
                </div>
            </div>

            <div className="col-12">
                <div className="card">
                    <DataTable
                        value={statistics}
                        expandedRows={expandedRows}
                        onRowToggle={(e) => setExpandedRows(e.data)}
                        rowExpansionTemplate={(rowData) => <StudentDetailView data={rowData} />}
                        dataKey="uniqueKey"
                        emptyMessage="조회된 데이터가 없습니다."
                        header={header}
                        paginator
                        rows={10}
                        rowsPerPageOptions={[10, 20, 50]}
                        filters={filters}
                        globalFilterFields={['name']}
                        sortField="totalPraiseCnt"
                        sortOrder={-1}
                    >
                        <Column expander style={{ width: '3em' }} />
                        <Column field="name" header="학생 이름" sortable headerStyle={{ minWidth: '150px' }} />
                        <Column
                            header="순위"
                            body={(rowData) => {
                                const rank = getRank(rowData.totalPraiseCnt);
                                let color = '#6c757d';
                                let scale = '1rem';
                                if (rank === 1) {
                                    color = '#FFD700';
                                    scale = '1.4rem';
                                } else if (rank === 2) {
                                    color = '#C0C0C0';
                                    scale = '1.2rem';
                                } else if (rank === 3) {
                                    color = '#CD7F32';
                                    scale = '1.1rem';
                                }

                                return (
                                    <div className="flex align-items-center gap-2">
                                        <span className="font-bold" style={{ color, fontSize: scale }}>
                                            {rank}위
                                        </span>
                                        {rank <= 3 && <i className="pi pi-trophy" style={{ color }} />}
                                    </div>
                                );
                            }}
                            sortable
                            sortField="totalPraiseCnt"
                        />
                        <Column
                            field="totalPraiseCnt"
                            header="총 칭찬 개수"
                            sortable
                            body={(rowData) => (
                                <div className="flex align-items-center gap-2">
                                    <span className="font-bold text-xl">{rowData.totalPraiseCnt}</span>
                                    <i className="pi pi-star-fill text-yellow-500" />
                                </div>
                            )}
                        />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default PraiseStatisticsPage;
