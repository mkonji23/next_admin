'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import dayjs from 'dayjs';

interface RewardCandidate {
    studentId: string;
    name: string;
    school: string;
    grade: string;
    rank: number;
    totalSeconds: number;
    praiseCount: number;
    canReward: boolean;
    canCancel?: boolean;
    status: 'AVAILABLE' | 'ALREADY_SETTLED_FOR_MONTH' | 'MONTHLY_LIMIT_EXCEEDED';
    statusMessage: string;
    rewardedAt?: string | null;
}

interface MonthlyPraiseRewardDialogProps {
    visible: boolean;
    onHide: () => void;
    onSuccess?: () => void;
    initialMonth?: string;
}

// 초를 "X시간 Y분 Z초"로 변환
const formatSeconds = (totalSeconds: number) => {
    if (!totalSeconds) return '0초';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const parts: string[] = [];
    if (h > 0) parts.push(`${h}시간`);
    if (m > 0) parts.push(`${m}분`);
    if (s > 0 || parts.length === 0) parts.push(`${s}초`);
    return parts.join(' ');
};

export default function MonthlyPraiseRewardDialog({
    visible,
    onHide,
    onSuccess,
    initialMonth
}: MonthlyPraiseRewardDialogProps) {
    const http = useHttp();
    const { showToast } = useToast();

    // 최근 6개월 선택 옵션 생성 (기본값: 지난달)
    const monthOptions = React.useMemo(() => {
        const opts: { label: string; value: string }[] = [];
        for (let i = 0; i < 6; i++) {
            const m = dayjs().subtract(i, 'month').format('YYYY-MM');
            const label = i === 0 ? `${m} (이번 달)` : i === 1 ? `${m} (지난 달)` : m;
            opts.push({ label, value: m });
        }
        return opts;
    }, []);

    const [selectedMonth, setSelectedMonth] = useState<string>(
        initialMonth || dayjs().subtract(1, 'month').format('YYYY-MM')
    );
    const [candidates, setCandidates] = useState<RewardCandidate[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [canceling, setCanceling] = useState<boolean>(false);

    useEffect(() => {
        if (visible && initialMonth) {
            setSelectedMonth(initialMonth);
        }
    }, [visible, initialMonth]);

    // 대상 월 후보 조회
    const fetchCandidates = async (monthStr: string) => {
        setLoading(true);
        try {
            const res = await http.get('/choiMath/studyTime/monthlyPraiseReward', {
                params: { month: monthStr }
            });
            setCandidates(res.data?.candidates || []);
        } catch (error: any) {
            console.error('Error fetching praise reward candidates:', error);
            showToast({
                severity: 'error',
                summary: '조회 실패',
                detail: error.response?.data?.message || '칭찬 지급 대상 조회에 실패했습니다.'
            });
            setCandidates([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible) {
            fetchCandidates(selectedMonth);
        }
    }, [visible, selectedMonth]);

    // 칭찬 지급 실행
    const handleGrant = async () => {
        const availableList = candidates.filter((c) => c.canReward);
        if (availableList.length === 0) {
            showToast({
                severity: 'warn',
                summary: '지급 불가',
                detail: '현재 지급 가능한 대상 학생이 없습니다.'
            });
            return;
        }

        const confirmMsg = `${selectedMonth} 월간 순공 랭커 ${availableList.length}명에게 칭찬을 지급하시겠습니까?\n\n(1등: 5개, 2등: 3개, 3등: 1개 / 한 달에 1회 제한 적용)`;
        if (!window.confirm(confirmMsg)) return;

        setSubmitting(true);
        try {
            const res = await http.post('/choiMath/studyTime/grantMonthlyPraise', {
                month: selectedMonth
            });

            if (res.data?.success) {
                showToast({
                    severity: 'success',
                    summary: '칭찬 지급 완료',
                    detail: res.data.message || '순공 칭찬이 성공적으로 지급되었습니다.'
                });
                fetchCandidates(selectedMonth);
                if (onSuccess) onSuccess();
            } else {
                showToast({
                    severity: 'warn',
                    summary: '안내',
                    detail: res.data?.message || '칭찬 지급 처리가 완료되지 않았습니다.'
                });
            }
        } catch (error: any) {
            console.error('Error granting monthly praise:', error);
            showToast({
                severity: 'error',
                summary: '지급 실패',
                detail: error.response?.data?.message || '칭찬 지급 처리 중 오류가 발생했습니다.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    // 개별 학생 칭찬 지급 취소
    const handleCancelSingle = async (candidate: RewardCandidate) => {
        const confirmMsg = `[${candidate.name}] 학생의 ${selectedMonth} 순공 칭찬(${candidate.praiseCount}개) 지급을 취소하시겠습니까?\n\n취소 시 학생의 칭찬 개수가 차감되며, 다시 지급 가능한 상태로 복구됩니다.`;
        if (!window.confirm(confirmMsg)) return;

        setCanceling(true);
        try {
            const res = await http.post('/choiMath/studyTime/cancelMonthlyPraise', {
                month: selectedMonth,
                studentId: candidate.studentId
            });

            if (res.data?.success) {
                showToast({
                    severity: 'info',
                    summary: '칭찬 지급 취소 완료',
                    detail: `[${candidate.name}] 학생의 순공 칭찬 지급이 취소되었습니다.`
                });
                fetchCandidates(selectedMonth);
                if (onSuccess) onSuccess();
            } else {
                showToast({
                    severity: 'warn',
                    summary: '안내',
                    detail: res.data?.message || '칭찬 지급 취소 처리가 완료되지 않았습니다.'
                });
            }
        } catch (error: any) {
            console.error('Error canceling praise reward:', error);
            showToast({
                severity: 'error',
                summary: '취소 실패',
                detail: error.response?.data?.message || '칭찬 지급 취소 중 오류가 발생했습니다.'
            });
        } finally {
            setCanceling(false);
        }
    };

    // 해당 월 전체 학생 칭찬 지급 취소
    const handleCancelAll = async () => {
        const cancelableList = candidates.filter((c) => c.canCancel);
        if (cancelableList.length === 0) return;

        const confirmMsg = `${selectedMonth} 월에 지급된 순공 칭찬(총 ${cancelableList.length}명)을 모두 지급 취소하시겠습니까?\n\n취소 시 학생들의 칭찬 개수가 차감되며, 다시 지급 가능한 상태로 복구됩니다.`;
        if (!window.confirm(confirmMsg)) return;

        setCanceling(true);
        try {
            const res = await http.post('/choiMath/studyTime/cancelMonthlyPraise', {
                month: selectedMonth
            });

            if (res.data?.success) {
                showToast({
                    severity: 'info',
                    summary: '전체 취소 완료',
                    detail: res.data.message || '순공 칭찬 지급이 모두 취소되었습니다.'
                });
                fetchCandidates(selectedMonth);
                if (onSuccess) onSuccess();
            } else {
                showToast({
                    severity: 'warn',
                    summary: '안내',
                    detail: res.data?.message || '칭찬 지급 취소 처리가 완료되지 않았습니다.'
                });
            }
        } catch (error: any) {
            console.error('Error canceling all monthly praise:', error);
            showToast({
                severity: 'error',
                summary: '취소 실패',
                detail: error.response?.data?.message || '칭찬 지급 취소 중 오류가 발생했습니다.'
            });
        } finally {
            setCanceling(false);
        }
    };

    // 순위 뱃지 렌더러
    const rankBodyTemplate = (row: RewardCandidate) => {
        let badgeColor = 'info';
        let icon = 'pi pi-star';
        if (row.rank === 1) {
            badgeColor = 'warning';
            icon = 'pi pi-crown';
        } else if (row.rank === 2) {
            badgeColor = 'success';
            icon = 'pi pi-star-fill';
        }

        return (
            <div className="flex align-items-center gap-2">
                <Tag
                    severity={badgeColor as any}
                    value={`${row.rank}등`}
                    icon={icon}
                    className="font-bold text-sm px-2 py-1"
                />
            </div>
        );
    };

    // 지급 칭찬 개수 렌더러
    const praiseCountTemplate = (row: RewardCandidate) => {
        return (
            <span className="font-bold text-base text-primary">
                +{row.praiseCount}개
            </span>
        );
    };

    // 상태 뱃지 렌더러
    const statusBodyTemplate = (row: RewardCandidate) => {
        if (row.status === 'AVAILABLE') {
            return (
                <Tag
                    severity="success"
                    value="지급 가능"
                    icon="pi pi-check-circle"
                    className="font-semibold text-xs"
                />
            );
        }
        if (row.status === 'ALREADY_SETTLED_FOR_MONTH') {
            return (
                <Tag
                    severity="info"
                    value="해당 월 지급완료"
                    icon="pi pi-verified"
                    className="font-semibold text-xs"
                />
            );
        }
        return (
            <Tag
                severity="warning"
                value="이번 달 이미 수령 (한 달 1회 제한)"
                icon="pi pi-shield"
                className="font-semibold text-xs"
            />
        );
    };

    // 개별 상태 액션 (지급 취소)
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
                    onClick={() => handleCancelSingle(row)}
                    disabled={submitting || canceling || loading}
                />
            );
        }
        if (row.canReward) {
            return <span className="text-xs text-500 font-medium">지급 대기</span>;
        }
        return <span className="text-xs text-400">-</span>;
    };

    const availableCount = candidates.filter((c) => c.canReward).length;
    const cancelableCount = candidates.filter((c) => c.canCancel).length;

    const dialogFooter = (
        <div className="flex flex-wrap align-items-center justify-content-between w-full pt-2 gap-2">
            <span className="text-xs text-600 font-medium text-left">
                💡 <span className="font-bold text-primary">한 달 1회 제한 안내:</span> 중복 지급이 차단되며, 잘못 지급한 경우 <span className="text-red-500 font-semibold">[지급 취소]</span>로 즉시 회수할 수 있습니다.
            </span>
            <div className="flex align-items-center gap-2">
                {cancelableCount > 0 && (
                    <Button
                        label={`해당 월 지급 취소 (${cancelableCount}명)`}
                        icon="pi pi-undo"
                        outlined
                        severity="danger"
                        className="font-semibold"
                        onClick={handleCancelAll}
                        loading={canceling}
                        disabled={submitting || loading}
                    />
                )}
                <Button
                    label={`지급하기 (${availableCount}명)`}
                    icon="pi pi-gift"
                    severity="success"
                    className="font-bold shadow-2"
                    onClick={handleGrant}
                    loading={submitting}
                    disabled={loading || canceling || availableCount === 0}
                />
                <Button
                    label="닫기"
                    icon="pi pi-times"
                    outlined
                    severity="secondary"
                    onClick={onHide}
                    disabled={submitting || canceling}
                />
            </div>
        </div>
    );

    return (
        <Dialog
            header={
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-gift text-primary text-2xl" />
                    <span className="font-bold text-xl">월간 순공 칭찬 지급</span>
                </div>
            }
            visible={visible}
            onHide={onHide}
            footer={dialogFooter}
            style={{ width: '840px', maxWidth: '95vw' }}
            breakpoints={{ '960px': '85vw', '640px': '98vw' }}
            className="p-fluid border-round-2xl shadow-6"
        >
            <div className="flex flex-column gap-3 pt-2">
                {/* 1. 상단 안내 및 대상 월 선택 바 */}
                <div className="flex flex-wrap align-items-center justify-content-between gap-3 p-3 surface-50 border-round-xl border-1 surface-border">
                    <div className="flex flex-column gap-1">
                        <span className="font-bold text-sm text-900">정산 대상 월 선택</span>
                        <span className="text-xs text-500">
                            선택한 월의 순공 1위(5개), 2위(3개), 3위(1개) 학생에게 칭찬을 지급하거나 지급을 취소할 수 있습니다.
                        </span>
                    </div>
                    <div className="w-13rem">
                        <Dropdown
                            value={selectedMonth}
                            options={monthOptions}
                            onChange={(e) => setSelectedMonth(e.value)}
                            placeholder="대상 월 선택"
                            className="p-inputtext-sm font-bold"
                            disabled={loading || submitting || canceling}
                        />
                    </div>
                </div>

                {/* 2. 대상 학생 테이블 */}
                <DataTable
                    value={candidates}
                    loading={loading}
                    emptyMessage={`${selectedMonth} 월에 순공시간이 기록된 1~3등 학생이 없습니다.`}
                    className="p-datatable-sm shadow-1 border-round-xl overflow-hidden"
                    responsiveLayout="scroll"
                >
                    <Column header="순위" body={rankBodyTemplate} style={{ width: '85px', textAlign: 'center' }} />
                    <Column
                        field="name"
                        header="학생명"
                        body={(row) => (
                            <div className="flex flex-column">
                                <span className="font-bold text-900 text-sm">{row.name}</span>
                                <span className="text-xs text-500">
                                    {row.school || '-'} {row.grade || ''}
                                </span>
                            </div>
                        )}
                        style={{ minWidth: '120px' }}
                    />
                    <Column
                        header="월간 순공시간"
                        body={(row) => (
                            <span className="font-semibold text-sm text-700">
                                {formatSeconds(row.totalSeconds)}
                            </span>
                        )}
                        style={{ minWidth: '120px' }}
                    />
                    <Column
                        header="지급 칭찬"
                        body={praiseCountTemplate}
                        style={{ width: '90px', textAlign: 'center' }}
                    />
                    <Column
                        header="지급 현황"
                        body={statusBodyTemplate}
                        style={{ minWidth: '160px' }}
                    />
                    <Column
                        header="상태"
                        body={actionBodyTemplate}
                        style={{ width: '100px', textAlign: 'center' }}
                    />
                </DataTable>
            </div>
        </Dialog>
    );
}
