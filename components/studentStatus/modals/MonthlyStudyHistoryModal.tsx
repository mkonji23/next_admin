'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { useHttp } from '@/util/axiosInstance';
import dayjs from 'dayjs';

interface MonthlySummaryItem {
    month: string;
    totalSeconds: number;
    sessionsCount: number;
    studyDaysCount: number;
    averageSecondsPerDay: number;
}

interface MonthlyStudyHistoryModalProps {
    visible: boolean;
    onHide: () => void;
    studentId?: string;
    studentName?: string;
    targetMonthStr?: string;
}

// 초를 "X시간 Y분 Z초" 텍스트로 변환하는 헬퍼
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

    const [monthlyHistory, setMonthlyHistory] = useState<MonthlySummaryItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const fetchMonthlyHistory = useCallback(async () => {
        if (!studentId) return;
        setLoading(true);
        try {
            const res = await httpRef.current.get('/choiMath/studyTime/getAllMonthlySummary', {
                params: { studentId },
                disableLoading: true
            });
            setMonthlyHistory(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Error fetching monthly summary list:', error);
        } finally {
            setLoading(false);
        }
    }, [studentId]);

    useEffect(() => {
        if (visible) {
            fetchMonthlyHistory();
        }
    }, [visible, fetchMonthlyHistory]);

    return (
        <Dialog
            header={
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-calendar-plus text-primary text-xl" />
                    <span className="font-bold text-lg">
                        {studentName ? `${studentName} 학생의 ` : ''}월별 순공시간 기록
                    </span>
                </div>
            }
            visible={visible}
            style={{ width: '90vw', maxWidth: '680px' }}
            modal
            dismissableMask
            onHide={onHide}
            footer={
                <div className="flex justify-content-end">
                    <Button
                        label="닫기"
                        icon="pi pi-check"
                        onClick={onHide}
                        className="p-button-sm"
                    />
                </div>
            }
        >
            <div className="p-1">
                <p className="text-xs text-500 mb-3">
                    스톱워치로 집중하여 기록된 역대 월별 순공시간 통계 목록입니다.
                </p>
                <DataTable
                    value={monthlyHistory}
                    loading={loading}
                    emptyMessage="기록된 월별 순공시간 내역이 없습니다."
                    stripedRows
                    responsiveLayout="scroll"
                    size="small"
                    className="p-datatable-sm"
                >
                    <Column
                        field="month"
                        header="기준 월"
                        style={{ minWidth: '130px' }}
                        body={(rowData: MonthlySummaryItem) => (
                            <div className="flex align-items-center gap-2">
                                <i className="pi pi-calendar text-500 text-xs" />
                                <span className="font-semibold text-900">
                                    {dayjs(rowData.month).format('YYYY년 M월')}
                                </span>
                                {rowData.month === targetMonthStr && (
                                    <Tag severity="success" value="현재선택" className="text-xs px-1 py-0" />
                                )}
                            </div>
                        )}
                    />
                    <Column
                        field="totalSeconds"
                        header="총 순공시간"
                        style={{ minWidth: '120px' }}
                        body={(rowData: MonthlySummaryItem) => (
                            <span className="font-bold text-green-600 dark:text-green-400">
                                {formatDuration(rowData.totalSeconds)}
                            </span>
                        )}
                    />
                    <Column
                        field="studyDaysCount"
                        header="학습 일수"
                        align="center"
                        style={{ minWidth: '90px' }}
                        body={(rowData: MonthlySummaryItem) => (
                            <span className="text-700 font-medium">
                                {rowData.studyDaysCount || 0}일
                            </span>
                        )}
                    />
                    <Column
                        field="averageSecondsPerDay"
                        header="일평균 순공"
                        style={{ minWidth: '110px' }}
                        body={(rowData: MonthlySummaryItem) => (
                            <span className="text-600 text-sm">
                                {formatDuration(rowData.averageSecondsPerDay || 0)}
                            </span>
                        )}
                    />
                    <Column
                        field="sessionsCount"
                        header="집중 세션"
                        align="center"
                        style={{ minWidth: '85px' }}
                        body={(rowData: MonthlySummaryItem) => (
                            <span className="text-500 text-sm">
                                {rowData.sessionsCount || 0}회
                            </span>
                        )}
                    />
                </DataTable>
            </div>
        </Dialog>
    );
};

export default MonthlyStudyHistoryModal;
