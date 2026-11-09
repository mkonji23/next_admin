'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DataTable, DataTableExpandedRows, DataTableValueArray } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { useHttp } from '@/util/axiosInstance';
import dayjs from 'dayjs';
import { MonthlySummaryHistoryItem, MonthlyWeekSummaryItem } from '@/types/studyTime';
import { getMonthWeeks } from '@/util/studyTimeWeekUtils';

interface MonthlyStudyHistoryModalProps {
    visible: boolean;
    onHide: () => void;
    studentId?: string;
    studentName?: string;
    targetMonthStr?: string;
}

const formatDuration = (totalSec: number) => {
    if (!totalSec || totalSec <= 0) return '0초';
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;

    const parts: string[] = [];
    if (h > 0) parts.push(`${h}시간`);
    if (m > 0) parts.push(`${m}분`);
    if (s > 0 || parts.length === 0) parts.push(`${s}초`);
    return parts.join(' ');
};

export const MonthlyStudyHistoryModal: React.FC<MonthlyStudyHistoryModalProps> = ({
    visible,
    onHide,
    studentId,
    studentName,
    targetMonthStr
}) => {
    const http = useHttp();
    const httpRef = useRef(http);
    useEffect(() => {
        httpRef.current = http;
    }, [http]);

    const [monthlyHistory, setMonthlyHistory] = useState<MonthlySummaryHistoryItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedYear, setSelectedYear] = useState<string>('all');
    const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows | DataTableValueArray | undefined>(undefined);

    const fetchMonthlyHistory = useCallback(async () => {
        if (!studentId) return;
        setLoading(true);
        try {
            const res = await httpRef.current.get('/choiMath/studyTime/getAllMonthlySummary', {
                params: { studentId },
                disableLoading: true
            });
            const data: MonthlySummaryHistoryItem[] = Array.isArray(res.data) ? res.data : [];
            setMonthlyHistory(data);
        } catch (error) {
            console.error('Error fetching monthly summary list:', error);
        } finally {
            setLoading(false);
        }
    }, [studentId]);

    useEffect(() => {
        if (visible) {
            setExpandedRows(undefined);
            fetchMonthlyHistory();

            // 팝업 오픈 시 바깥 화면(배경 body) 스크롤 금지 (Scroll Lock)
            const originalOverflow = document.body.style.overflow;
            const originalTouchAction = document.body.style.touchAction;
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';

            return () => {
                document.body.style.overflow = originalOverflow;
                document.body.style.touchAction = originalTouchAction;
            };
        }
    }, [visible, fetchMonthlyHistory]);

    // 연도 필터 옵션
    const yearOptions = useMemo(() => {
        const years = Array.from(new Set(monthlyHistory.map((item) => item.month?.split('-')[0]).filter(Boolean)));
        years.sort((a, b) => b.localeCompare(a));
        return [{ label: '전체 연도', value: 'all' }, ...years.map((y) => ({ label: `${y}년`, value: y }))];
    }, [monthlyHistory]);

    // 연도 필터 적용
    const filteredList = useMemo(() => {
        if (selectedYear === 'all') return monthlyHistory;
        return monthlyHistory.filter((item) => item.month?.startsWith(selectedYear));
    }, [monthlyHistory, selectedYear]);

    // 주차별 상세 정보 템플릿 (rowExpansionTemplate)
    const weekExpansionTemplate = (rowData: MonthlySummaryHistoryItem) => {
        // 백엔드에서 제공된 weeks 정보가 있으면 사용하고, 없을 경우 getMonthWeeks 기반 기본 생성
        const weekList: MonthlyWeekSummaryItem[] =
            rowData.weeks && rowData.weeks.length > 0
                ? rowData.weeks
                : getMonthWeeks(rowData.month).map((w) => ({
                      weekNumber: w.weekNumber,
                      weekLabel: w.weekLabel,
                      startDate: w.startDate,
                      endDate: w.endDate,
                      periodLabel: w.periodLabel,
                      totalSeconds: 0,
                      studyDaysCount: 0,
                      averageSecondsPerDay: 0
                  }));

        return (
            <div className="p-3 surface-50 dark:surface-900 border-round-lg m-2 border-1 surface-border shadow-1">
                <div className="flex align-items-center justify-content-between mb-2 pb-1 border-bottom-1 surface-border">
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-calendar-times text-primary text-sm" />
                        <span className="font-bold text-sm text-900">
                            {dayjs(rowData.month).format('YYYY년 M월')} 주차별 순공시간 현황
                        </span>
                    </div>
                    <span className="text-xs text-500 font-medium">총 {weekList.length}개 주차</span>
                </div>
                <DataTable
                    value={weekList}
                    size="small"
                    className="p-datatable-sm"
                    responsiveLayout="scroll"
                    emptyMessage="해당 월의 주차별 데이터가 없습니다."
                >
                    <Column
                        field="weekLabel"
                        header="주차"
                        style={{ minWidth: '150px' }}
                        body={(week: MonthlyWeekSummaryItem) => (
                            <div className="flex align-items-center gap-2">
                                <Tag severity="info" value={week.weekLabel} />
                                <span className="text-xs text-600 font-normal">({week.periodLabel})</span>
                            </div>
                        )}
                    />
                    <Column
                        field="totalSeconds"
                        header="주간 순공시간"
                        style={{ minWidth: '130px' }}
                        body={(week: MonthlyWeekSummaryItem) => (
                            <span
                                className={`font-semibold text-sm ${
                                    week.totalSeconds > 0
                                        ? 'text-green-600 dark:text-green-400 font-bold'
                                        : 'text-400 font-normal'
                                }`}
                            >
                                {formatDuration(week.totalSeconds || 0)}
                            </span>
                        )}
                    />
                    <Column
                        field="studyDaysCount"
                        header="학습 일수"
                        align="center"
                        style={{ minWidth: '100px' }}
                        body={(week: MonthlyWeekSummaryItem) => (
                            <span className="text-700 text-sm font-medium">
                                {week.studyDaysCount ? `${week.studyDaysCount}일` : '-'}
                            </span>
                        )}
                    />
                    <Column
                        field="averageSecondsPerDay"
                        header="일평균 순공"
                        style={{ minWidth: '130px' }}
                        body={(week: MonthlyWeekSummaryItem) => (
                            <span className="text-600 text-sm">
                                {week.totalSeconds > 0 ? formatDuration(week.averageSecondsPerDay || 0) : '-'}
                            </span>
                        )}
                    />
                </DataTable>
            </div>
        );
    };

    return (
        <Dialog
            header={
                <div className="flex align-items-center justify-content-between w-full pr-3">
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-calendar text-primary text-xl" />
                        <span className="font-bold text-lg">
                            {studentName ? `${studentName} 학생 - ` : ''}월별 순공시간 목록
                        </span>
                    </div>
                    {yearOptions.length > 2 && (
                        <Dropdown
                            value={selectedYear}
                            options={yearOptions}
                            onChange={(e) => setSelectedYear(e.value)}
                            className="p-inputtext-sm"
                            style={{ width: '120px' }}
                        />
                    )}
                </div>
            }
            visible={visible}
            style={{ width: '92vw', maxWidth: '750px' }}
            modal
            dismissableMask
            blockScroll
            contentStyle={{ maxHeight: '72vh', overflowY: 'auto' }}
            onHide={onHide}
            footer={
                <div className="flex justify-content-end">
                    <Button label="닫기" icon="pi pi-check" onClick={onHide} className="p-button-sm" />
                </div>
            }
        >
            <div className="p-1">
                <DataTable
                    value={filteredList}
                    loading={loading}
                    dataKey="month"
                    expandedRows={expandedRows}
                    onRowToggle={(e) => setExpandedRows(e.data)}
                    rowExpansionTemplate={weekExpansionTemplate}
                    emptyMessage="기록된 순공시간 내역이 없습니다."
                    stripedRows
                    responsiveLayout="scroll"
                    size="small"
                    className="p-datatable-sm"
                    sortField="month"
                    sortOrder={-1}
                >
                    <Column expander style={{ width: '3.5rem' }} />
                    <Column
                        field="month"
                        header="기준 월"
                        sortable
                        style={{ minWidth: '140px' }}
                        body={(rowData: MonthlySummaryHistoryItem) => (
                            <div className="flex align-items-center gap-2">
                                <i className="pi pi-calendar text-500 text-xs" />
                                <span className="font-semibold text-900">
                                    {dayjs(rowData.month).format('YYYY년 M월')}
                                </span>
                            </div>
                        )}
                    />
                    <Column
                        field="totalSeconds"
                        header="총 순공시간"
                        sortable
                        style={{ minWidth: '130px' }}
                        body={(rowData: MonthlySummaryHistoryItem) => (
                            <span className="font-bold text-green-600 dark:text-green-400">
                                {formatDuration(rowData.totalSeconds)}
                            </span>
                        )}
                    />
                    <Column
                        field="studyDaysCount"
                        header="학습 일수"
                        sortable
                        align="center"
                        style={{ minWidth: '110px' }}
                        body={(rowData: MonthlySummaryHistoryItem) => (
                            <span className="text-700 font-medium">{rowData.studyDaysCount || 0}일</span>
                        )}
                    />
                    <Column
                        field="averageSecondsPerDay"
                        header="일평균 순공"
                        sortable
                        style={{ minWidth: '130px' }}
                        body={(rowData: MonthlySummaryHistoryItem) => (
                            <span className="text-600 text-sm">
                                {formatDuration(rowData.averageSecondsPerDay || 0)}
                            </span>
                        )}
                    />
                </DataTable>
            </div>
        </Dialog>
    );
};

export default MonthlyStudyHistoryModal;
