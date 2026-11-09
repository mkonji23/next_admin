'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Tooltip } from 'primereact/tooltip';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import dayjs from 'dayjs';
import { getMonthWeeks, getCurrentWeekInfo, MonthWeekInfo } from '@/util/studyTimeWeekUtils';

interface RewardCandidate {
    studentId: string;
    name: string;
    school: string;
    grade: string;
    className?: string;
    rank: number;
    totalSeconds: number;
    praiseCount: number;
    canReward: boolean;
    canCancel?: boolean;
    status: 'AVAILABLE' | 'ALREADY_SETTLED_FOR_MONTH';
    statusMessage: string;
    rewardedAt?: string | null;
    rewardedBy?: string | null;
}

interface PeriodOption {
    label: string;
    value: string;
    periodType: 'MONTH' | 'WEEK';
    weekNumber: number | null;
    dateFrom: string | null;
    dateTo: string | null;
    periodLabel: string;
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

export default function StudyTimeSettlementPage() {
    const http = useHttp();
    const { showToast } = useToast();

    // 1. 최근 12개월 선택 옵션
    const monthOptions = useMemo(() => {
        const opts: { label: string; value: string }[] = [];
        for (let i = 0; i < 12; i++) {
            const m = dayjs().subtract(i, 'month').format('YYYY-MM');
            const label = i === 0 ? `${dayjs().format('YYYY년 M월')} (이번 달)` : i === 1 ? `${dayjs().subtract(1, 'month').format('YYYY년 M월')} (지난 달)` : dayjs().subtract(i, 'month').format('YYYY년 M월');
            opts.push({ label, value: m });
        }
        return opts;
    }, []);

    // 기준 월에 따른 기본 결산 기간 단위 키 (이번 달이면 오늘 날짜 기준 이번 주차, 다른 달이면 1주차)
    const getDefaultPeriodKey = useCallback((monthStr: string) => {
        const isThisMonth = dayjs().format('YYYY-MM') === monthStr;
        if (isThisMonth) {
            const todayWeek = getCurrentWeekInfo();
            return String(todayWeek.weekNumber);
        }
        return '1';
    }, []);

    const [selectedMonth, setSelectedMonth] = useState<string>(dayjs().format('YYYY-MM'));

    // 2. 선택된 월의 주차 목록 계산
    const currentMonthWeeks = useMemo(() => {
        return getMonthWeeks(selectedMonth);
    }, [selectedMonth]);

    // 3. 결산 기간 단위 옵션 (월 전체 + 주차별)
    const periodOptions = useMemo<PeriodOption[]>(() => {
        const startOfMonth = dayjs(selectedMonth).startOf('month').format('MM.DD');
        const endOfMonth = dayjs(selectedMonth).endOf('month').format('MM.DD');
        const isThisMonth = dayjs().format('YYYY-MM') === selectedMonth;
        const todayWeek = getCurrentWeekInfo();

        const list: PeriodOption[] = [
            {
                label: `월 전체 결산 (${startOfMonth} ~ ${endOfMonth})`,
                value: 'ALL',
                periodType: 'MONTH',
                weekNumber: null,
                dateFrom: null,
                dateTo: null,
                periodLabel: `${dayjs(selectedMonth).format('YYYY년 M월')} 전체`
            }
        ];

        currentMonthWeeks.forEach((w) => {
            const isTodayWeek = isThisMonth && w.weekNumber === todayWeek.weekNumber;
            list.push({
                label: `${w.weekLabel} 결산 (${w.periodLabel})${isTodayWeek ? ' (이번 주)' : ''}`,
                value: String(w.weekNumber),
                periodType: 'WEEK',
                weekNumber: w.weekNumber,
                dateFrom: w.startDate,
                dateTo: w.endDate,
                periodLabel: `${dayjs(selectedMonth).format('M월')} ${w.weekLabel} (${w.periodLabel})`
            });
        });

        return list;
    }, [selectedMonth, currentMonthWeeks]);

    // 오늘 날짜 기준으로 이번 주차를 기본 선택값으로 설정
    const [selectedPeriodKey, setSelectedPeriodKey] = useState<string>(() =>
        getDefaultPeriodKey(dayjs().format('YYYY-MM'))
    );

    // 현재 선택된 기간 정보
    const currentPeriodInfo = useMemo(() => {
        const found = periodOptions.find((p) => p.value === selectedPeriodKey);
        if (found) return found;
        const defaultKey = getDefaultPeriodKey(selectedMonth);
        const defaultOption = periodOptions.find((p) => p.value === defaultKey);
        return defaultOption || periodOptions[0];
    }, [periodOptions, selectedPeriodKey, selectedMonth, getDefaultPeriodKey]);

    // 상태값들
    const [candidates, setCandidates] = useState<RewardCandidate[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [grantDialogVisible, setGrantDialogVisible] = useState<boolean>(false);
    const [cancelDialogVisible, setCancelDialogVisible] = useState<boolean>(false);
    const [selectedCancelTarget, setSelectedCancelTarget] = useState<RewardCandidate | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);

    // 후보자 목록 조회
    const fetchCandidates = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {
                month: selectedMonth,
                periodType: currentPeriodInfo.periodType
            };

            if (currentPeriodInfo.periodType === 'WEEK') {
                params.weekNumber = currentPeriodInfo.weekNumber;
                params.dateFrom = currentPeriodInfo.dateFrom;
                params.dateTo = currentPeriodInfo.dateTo;
            }

            const res = await http.get('/choiMath/studyTime/monthlyPraiseReward', { params });
            setCandidates(res.data?.candidates || []);
        } catch (error: any) {
            console.error('Error fetching praise candidates:', error);
            showToast({
                severity: 'error',
                summary: '조회 실패',
                detail: error.response?.data?.message || '결산 대상자 정보를 불러오는데 실패했습니다.'
            });
            setCandidates([]);
        } finally {
            setLoading(false);
        }
    }, [selectedMonth, currentPeriodInfo]);

    useEffect(() => {
        fetchCandidates();
    }, []);

    // 결산 지급 가능 및 취소 가능 수
    const availableCount = candidates.filter((c) => c.canReward).length;
    const settledCount = candidates.filter((c) => c.canCancel).length;

    // 결산 지급 실행
    const handleGrantSettlement = async () => {
        setSubmitting(true);
        try {
            const payload: any = {
                month: selectedMonth,
                periodType: currentPeriodInfo.periodType,
                settledPeriodKey:
                    currentPeriodInfo.periodType === 'WEEK'
                        ? `${selectedMonth}-W${currentPeriodInfo.weekNumber}`
                        : selectedMonth
            };

            if (currentPeriodInfo.periodType === 'WEEK') {
                payload.weekNumber = currentPeriodInfo.weekNumber;
                payload.dateFrom = currentPeriodInfo.dateFrom;
                payload.dateTo = currentPeriodInfo.dateTo;
            }

            const res = await http.post('/choiMath/studyTime/grantMonthlyPraise', payload);

            if (res.data?.success) {
                showToast({
                    severity: 'success',
                    summary: '결산 지급 완료',
                    detail: res.data.message || '순공시간 칭찬 결산 지급이 완료되었습니다.'
                });
                setGrantDialogVisible(false);
                fetchCandidates();
            } else {
                showToast({
                    severity: 'warn',
                    summary: '안내',
                    detail: res.data?.message || '결산 처리가 완료되지 않았습니다.'
                });
            }
        } catch (error: any) {
            console.error('Error granting praise settlement:', error);
            showToast({
                severity: 'error',
                summary: '결산 실패',
                detail: error.response?.data?.message || '칭찬 결산 처리 중 오류가 발생했습니다.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    // 결산 지급 취소 실행 (단일 학생 또는 전체)
    const handleCancelSettlement = async () => {
        setSubmitting(true);
        try {
            const payload: any = {
                month: selectedMonth,
                settledPeriodKey:
                    currentPeriodInfo.periodType === 'WEEK'
                        ? `${selectedMonth}-W${currentPeriodInfo.weekNumber}`
                        : selectedMonth
            };

            if (selectedCancelTarget) {
                payload.studentId = selectedCancelTarget.studentId;
            }

            const res = await http.post('/choiMath/studyTime/cancelMonthlyPraise', payload);

            if (res.data?.success) {
                showToast({
                    severity: 'info',
                    summary: '지급 취소 완료',
                    detail: res.data.message || '칭찬 결산 지급이 정상적으로 취소되었습니다.'
                });
                setCancelDialogVisible(false);
                setSelectedCancelTarget(null);
                fetchCandidates();
            } else {
                showToast({
                    severity: 'warn',
                    summary: '안내',
                    detail: res.data?.message || '지급 취소 처리가 완료되지 않았습니다.'
                });
            }
        } catch (error: any) {
            console.error('Error canceling praise settlement:', error);
            showToast({
                severity: 'error',
                summary: '취소 실패',
                detail: error.response?.data?.message || '칭찬 지급 취소 중 오류가 발생했습니다.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    // 순위 뱃지 렌더러
    const rankBodyTemplate = (row: RewardCandidate) => {
        if (row.rank === 1) {
            return (
                <div className="flex align-items-center justify-content-center">
                    <Tag severity="warning" value="1등" icon="pi pi-crown" className="font-bold text-sm px-2 py-1" />
                </div>
            );
        }
        if (row.rank === 2) {
            return (
                <div className="flex align-items-center justify-content-center">
                    <Tag severity="success" value="2등" icon="pi pi-star-fill" className="font-bold text-sm px-2 py-1" />
                </div>
            );
        }
        return (
            <div className="flex align-items-center justify-content-center">
                <Tag severity="info" value="3등" icon="pi pi-star" className="font-bold text-sm px-2 py-1" />
            </div>
        );
    };

    // 학생명 렌더러
    const nameBodyTemplate = (row: RewardCandidate) => (
        <div className="flex flex-column gap-1">
            <span className="font-bold text-900 text-sm">{row.name}</span>
            <span className="text-xs text-500">
                {[row.school, row.grade].filter(Boolean).join(' ') || '학교/학년 미지정'}
            </span>
        </div>
    );

    // 지급 칭찬 렌더러
    const praiseBodyTemplate = (row: RewardCandidate) => (
        <div className="flex align-items-center justify-content-center gap-1">
            <i className="pi pi-star-fill text-yellow-500 text-sm" />
            <span className="font-bold text-base text-primary">+{row.praiseCount}개</span>
        </div>
    );

    // 지급 현황 렌더러
    const statusBodyTemplate = (row: RewardCandidate) => {
        if (row.canReward) {
            return (
                <div className="flex align-items-center gap-1">
                    <Tag severity="success" value="지급 대기" icon="pi pi-clock" className="font-semibold text-xs" />
                </div>
            );
        }
        return (
            <div className="flex flex-column gap-1">
                <div className="flex align-items-center gap-1">
                    <Tag severity="info" value="지급 완료" icon="pi pi-verified" className="font-semibold text-xs" />
                </div>
                {row.rewardedAt && (
                    <span className="text-xs text-500">
                        {dayjs(row.rewardedAt).format('YYYY-MM-DD HH:mm')}
                    </span>
                )}
            </div>
        );
    };

    // 작업(지급 취소) 렌더러
    const actionBodyTemplate = (row: RewardCandidate) => {
        if (row.canCancel) {
            return (
                <Button
                    label="지급 취소"
                    icon="pi pi-undo"
                    severity="danger"
                    outlined
                    size="small"
                    className="p-button-sm text-xs py-1 px-2 font-medium"
                    onClick={() => {
                        setSelectedCancelTarget(row);
                        setCancelDialogVisible(true);
                    }}
                    disabled={submitting || loading}
                />
            );
        }
        return <span className="text-xs text-400 font-medium">-</span>;
    };

    return (
        <div className="grid">
            {/* 1. 상단 안내 및 설정 카드 */}
            <div className="col-12">
                <div className="card shadow-2 border-round-xl">
                    <div className="flex flex-wrap align-items-center justify-content-between gap-3 mb-4 pb-3 border-bottom-1 surface-border">
                        <div className="flex align-items-center gap-3">
                            <div className="flex align-items-center justify-content-center bg-primary-50 text-primary border-round-xl w-3rem h-3rem">
                                <i className="pi pi-stopwatch text-2xl text-primary" />
                            </div>
                            <div className="flex flex-column">
                                <h4 className="m-0 font-bold text-900">공부시간 결산</h4>
                                <span className="text-sm text-600 mt-1">
                                    월간 및 주차별 순공시간 랭킹(1~3등)을 집계하여 칭찬 스탬프를 결산 지급하고 관리합니다.
                                </span>
                            </div>
                        </div>

                        {/* 시상 기준 안내 배지 */}
                        <div className="flex align-items-center gap-2 bg-surface-50 dark:bg-surface-900 p-2 border-round-lg border-1 surface-border">
                            <span className="text-xs font-semibold text-700 mr-1">칭찬 지급 기준:</span>
                            <Tag severity="warning" value="🥇 1등: 5개" className="font-semibold text-xs" />
                            <Tag severity="success" value="🥈 2등: 3개" className="font-semibold text-xs" />
                            <Tag severity="info" value="🥉 3등: 1개" className="font-semibold text-xs" />
                        </div>
                    </div>

                    {/* 셀렉트박스 및 결산 버튼 영역 */}
                    <div className="flex flex-wrap align-items-end justify-content-between gap-3">
                        <div className="flex flex-wrap align-items-center gap-3">
                            {/* 기준 월 선택 */}
                            <div className="flex flex-column gap-1">
                                <label className="font-bold text-xs text-700">기준 월</label>
                                <Dropdown
                                    value={selectedMonth}
                                    options={monthOptions}
                                    onChange={(e) => {
                                        setSelectedMonth(e.value);
                                        setSelectedPeriodKey(getDefaultPeriodKey(e.value));
                                    }}
                                    className="p-inputtext-sm font-semibold w-14rem"
                                    disabled={loading || submitting}
                                />
                            </div>

                            {/* 결산 단위 선택 (월 전체 또는 주차별) */}
                            <div className="flex flex-column gap-1">
                                <label className="font-bold text-xs text-700">결산 기간 단위</label>
                                <Dropdown
                                    value={selectedPeriodKey}
                                    options={periodOptions}
                                    onChange={(e) => setSelectedPeriodKey(e.value)}
                                    className="p-inputtext-sm font-semibold w-20rem"
                                    disabled={loading || submitting}
                                />
                            </div>

                            <Button
                                icon="pi pi-refresh"
                                outlined
                                severity="secondary"
                                tooltip="새로고침"
                                tooltipOptions={{ position: 'top' }}
                                onClick={fetchCandidates}
                                loading={loading}
                                className="mt-3"
                            />
                        </div>

                        {/* 결산 및 일괄 취소 버튼 */}
                        <div className="flex align-items-center gap-2">
                            {settledCount > 0 && (
                                <Button
                                    label={`결산 지급 취소 (${settledCount}명)`}
                                    icon="pi pi-undo"
                                    severity="danger"
                                    outlined
                                    className="font-bold shadow-1"
                                    onClick={() => {
                                        setSelectedCancelTarget(null);
                                        setCancelDialogVisible(true);
                                    }}
                                    disabled={loading || submitting}
                                />
                            )}
                            <Button
                                label={`공부시간 결산 (${availableCount}명 지급)`}
                                icon="pi pi-gift"
                                severity="success"
                                className="font-bold shadow-2"
                                onClick={() => setGrantDialogVisible(true)}
                                disabled={loading || submitting || availableCount === 0}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. 결산 대상 학생 데이터 테이블 */}
            <div className="col-12">
                <div className="card shadow-2 border-round-xl">
                    <div className="flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                        <div className="flex align-items-center gap-2">
                            <span className="font-bold text-lg text-900">{currentPeriodInfo.periodLabel} 결산 대상자</span>
                            <Tag value={`총 ${candidates.length}명`} severity="info" className="font-bold text-xs" />
                        </div>
                        <div className="flex align-items-center gap-3 text-xs text-600 font-medium">
                            <span>
                                지급 대기: <strong className="text-green-600">{availableCount}명</strong>
                            </span>
                            <span>
                                지급 완료: <strong className="text-blue-600">{settledCount}명</strong>
                            </span>
                        </div>
                    </div>

                    <DataTable
                        value={candidates}
                        loading={loading}
                        dataKey="studentId"
                        emptyMessage={`${currentPeriodInfo.periodLabel}에 순공시간이 기록된 1~3등 대상 학생이 없습니다.`}
                        stripedRows
                        responsiveLayout="scroll"
                        className="p-datatable-sm"
                    >
                        <Column
                            header="순위"
                            body={rankBodyTemplate}
                            style={{ width: '90px', textAlign: 'center' }}
                        />
                        <Column
                            header="학생 정보"
                            body={nameBodyTemplate}
                            style={{ minWidth: '150px' }}
                        />
                        <Column
                            field="className"
                            header="클래스"
                            style={{ minWidth: '130px' }}
                            body={(row) => <span className="text-700 text-sm font-medium">{row.className || '-'}</span>}
                        />
                        <Column
                            header="순공시간"
                            style={{ minWidth: '130px' }}
                            body={(row) => (
                                <span className="font-bold text-sm text-700">
                                    {formatDuration(row.totalSeconds)}
                                </span>
                            )}
                        />
                        <Column
                            header="지급 칭찬"
                            body={praiseBodyTemplate}
                            style={{ width: '120px', textAlign: 'center' }}
                        />
                        <Column
                            header="지급 현황"
                            body={statusBodyTemplate}
                            style={{ minWidth: '140px' }}
                        />
                        <Column
                            header="관리"
                            body={actionBodyTemplate}
                            style={{ width: '110px', textAlign: 'center' }}
                        />
                    </DataTable>
                </div>
            </div>

            {/* 결산 지급 확인 다이얼로그 */}
            <Dialog
                header={
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-gift text-primary text-xl" />
                        <span className="font-bold text-lg">공부시간 결산 지급 확인</span>
                    </div>
                }
                visible={grantDialogVisible}
                onHide={() => setGrantDialogVisible(false)}
                style={{ width: '540px', maxWidth: '95vw' }}
                className="border-round-2xl shadow-6"
                footer={
                    <div className="flex align-items-center justify-content-end gap-2 pt-2">
                        <Button
                            label="취소"
                            icon="pi pi-times"
                            outlined
                            severity="secondary"
                            onClick={() => setGrantDialogVisible(false)}
                            disabled={submitting}
                        />
                        <Button
                            label="결산 지급 실행"
                            icon="pi pi-check"
                            severity="success"
                            className="font-bold shadow-1"
                            onClick={handleGrantSettlement}
                            loading={submitting}
                        />
                    </div>
                }
            >
                <div className="flex flex-column gap-3 py-2">
                    <div className="p-3 surface-50 border-round-xl border-1 surface-border">
                        <div className="text-sm font-bold text-900 mb-2">
                            {currentPeriodInfo.periodLabel} 결산을 진행하시겠습니까?
                        </div>
                        <div className="text-xs text-600 line-height-3">
                            순공시간 1~3등 미지급 학생 <strong>{availableCount}명</strong>에게 칭찬 스탬프가 즉시 지급되며, 지급 내역은 학생 칭찬 통계 및 칭찬 결산에 자동 반영됩니다.
                        </div>
                    </div>
                    <div className="flex flex-column gap-1 max-h-12rem overflow-y-auto pr-1">
                        {candidates
                            .filter((c) => c.canReward)
                            .map((c) => (
                                <div
                                    key={c.studentId}
                                    className="flex align-items-center justify-content-between p-2 border-bottom-1 surface-border"
                                >
                                    <div className="flex align-items-center gap-2">
                                        <Tag
                                            value={`${c.rank}등`}
                                            severity={c.rank === 1 ? 'warning' : c.rank === 2 ? 'success' : 'info'}
                                            className="text-xs"
                                        />
                                        <span className="font-bold text-sm text-900">{c.name}</span>
                                        <span className="text-xs text-500">({formatDuration(c.totalSeconds)})</span>
                                    </div>
                                    <span className="font-bold text-primary text-sm">+{c.praiseCount}개</span>
                                </div>
                            ))}
                    </div>
                </div>
            </Dialog>

            {/* 결산 취소 확인 다이얼로그 */}
            <Dialog
                header={
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-exclamation-triangle text-red-500 text-xl" />
                        <span className="font-bold text-lg">
                            {selectedCancelTarget ? `[${selectedCancelTarget.name}] 칭찬 지급 취소` : '결산 지급 전체 취소'}
                        </span>
                    </div>
                }
                visible={cancelDialogVisible}
                onHide={() => {
                    setCancelDialogVisible(false);
                    setSelectedCancelTarget(null);
                }}
                style={{ width: '520px', maxWidth: '95vw' }}
                className="border-round-2xl shadow-6"
                footer={
                    <div className="flex align-items-center justify-content-end gap-2 pt-2">
                        <Button
                            label="닫기"
                            icon="pi pi-times"
                            outlined
                            severity="secondary"
                            onClick={() => {
                                setCancelDialogVisible(false);
                                setSelectedCancelTarget(null);
                            }}
                            disabled={submitting}
                        />
                        <Button
                            label="지급 취소 실행"
                            icon="pi pi-undo"
                            severity="danger"
                            className="font-bold shadow-1"
                            onClick={handleCancelSettlement}
                            loading={submitting}
                        />
                    </div>
                }
            >
                <div className="flex flex-column gap-3 py-2">
                    <div className="p-3 bg-red-50 dark:bg-red-950 border-round-xl border-1 border-red-200 dark:border-red-800">
                        <div className="text-sm font-bold text-red-800 dark:text-red-200 mb-1">
                            {selectedCancelTarget
                                ? `[${selectedCancelTarget.name}] 학생의 순공 칭찬(+${selectedCancelTarget.praiseCount}개) 지급을 취소하시겠습니까?`
                                : `${currentPeriodInfo.periodLabel}에 지급된 순공 칭찬(총 ${settledCount}명)을 모두 취소하시겠습니까?`}
                        </div>
                        <div className="text-xs text-red-600 dark:text-red-300 line-height-3">
                            지급 취소 시 학생의 칭찬 개수가 차감(회수)되며, 다시 결산 대상(지급 대기) 상태로 복구됩니다.
                        </div>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
