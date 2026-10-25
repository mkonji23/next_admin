'use client';

import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Tooltip } from 'primereact/tooltip';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { LayoutContext } from '@/layout/context/layoutcontext';
import { useHttp } from '@/util/axiosInstance';
import dayjs, { Dayjs } from 'dayjs';

interface StudyRankingCardProps {
    studentId?: string;
    studentName?: string;
    currentMonth?: Dayjs | string | Date; // 선택된 월 (YYYY-MM 또는 Dayjs 객체)
    currentActiveSeconds?: number;
    isRunning?: boolean;
}

interface RankingUser {
    rank: number;
    studentId: string;
    name: string;
    school?: string;
    grade?: string | number;
    profile?: string;
    totalSeconds: number;
    sessionsCount?: number;
    studyDaysCount?: number;
    firstStartedAt?: string;
    lastEndedAt?: string;
}

interface MonthlySummaryItem {
    month: string;
    totalSeconds: number;
    sessionsCount: number;
    studyDaysCount: number;
    averageSecondsPerDay: number;
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

export const StudyRankingCard: React.FC<StudyRankingCardProps> = ({
    studentId,
    studentName,
    currentMonth,
    currentActiveSeconds = 0,
    isRunning = false
}) => {
    const { layoutConfig } = useContext(LayoutContext);
    const isDark = layoutConfig?.colorScheme === 'dark';
    const http = useHttp();
    const httpRef = useRef(http);
    useEffect(() => {
        httpRef.current = http;
    }, [http]);

    const [loading, setLoading] = useState<boolean>(false);
    const [topRankers, setTopRankers] = useState<RankingUser[]>([]);
    const [myRank, setMyRank] = useState<number | null>(null);
    const [serverMySeconds, setServerMySeconds] = useState<number>(0);
    const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');

    // 월별 순공시간 목록 팝업(Dialog) 상태
    const [monthlyModalOpen, setMonthlyModalOpen] = useState<boolean>(false);
    const [monthlyHistory, setMonthlyHistory] = useState<MonthlySummaryItem[]>([]);
    const [monthlyHistoryLoading, setMonthlyHistoryLoading] = useState<boolean>(false);

    // 선택된 월 문자열 (YYYY-MM) 및 한글 월 이름 (예: "10월")
    const targetMonthStr = dayjs(currentMonth || dayjs()).format('YYYY-MM');
    const monthDisplayName = dayjs(currentMonth || dayjs()).format('M월');

    // 현재 선택된 월이 이번 달인 경우 실시간 스톱워치 초 반영
    const isCurrentActiveMonth = dayjs().format('YYYY-MM') === targetMonthStr;
    const effectiveMySeconds = isCurrentActiveMonth
        ? Math.max(serverMySeconds, serverMySeconds + currentActiveSeconds)
        : serverMySeconds;

    const fetchRankings = useCallback(async () => {
        if (!studentId) return;
        setLoading(true);
        try {
            const res = await httpRef.current.get('/choiMath/studyTime/getRankings', {
                params: {
                    month: targetMonthStr,
                    limit: 3,
                    studentId
                },
                disableLoading: true
            });

            const data = res.data || {};
            setTopRankers(data.rankings || []);
            setMyRank(data.myRank || null);
            setServerMySeconds(data.myTotalSeconds || 0);
            setLastUpdatedTime(dayjs().format('HH:mm:ss'));
        } catch (error) {
            console.error('Error fetching monthly study rankings:', error);
        } finally {
            setLoading(false);
        }
    }, [studentId, targetMonthStr]);

    // 학생의 전체 월별 순공시간 요약 목록 조회
    const fetchMonthlyHistory = useCallback(async () => {
        if (!studentId) return;
        setMonthlyHistoryLoading(true);
        try {
            const res = await httpRef.current.get('/choiMath/studyTime/getAllMonthlySummary', {
                params: { studentId },
                disableLoading: true
            });
            setMonthlyHistory(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Error fetching monthly summary list:', error);
        } finally {
            setMonthlyHistoryLoading(false);
        }
    }, [studentId]);

    // 월(currentMonth) 변경 시 또는 학생 변경 시 즉시 갱신
    useEffect(() => {
        fetchRankings();
    }, [fetchRankings]);

    // 60초마다 실시간 랭킹 자동 리프레시 (이번 달을 보고 있을 때)
    useEffect(() => {
        if (!isCurrentActiveMonth) return;
        const interval = setInterval(() => {
            fetchRankings();
        }, 60000);
        return () => clearInterval(interval);
    }, [fetchRankings, isCurrentActiveMonth]);

    // 트로피 및 랭킹 컬러 헬퍼
    const getTrophyMeta = (rank: number) => {
        if (rank === 1) {
            return {
                icon: 'pi pi-trophy',
                color: '#eab308',
                bg: isDark ? 'rgba(234, 179, 8, 0.15)' : '#fef9c3',
                border: '#fde047',
                label: '1위 👑'
            };
        }
        if (rank === 2) {
            return {
                icon: 'pi pi-trophy',
                color: '#94a3b8',
                bg: isDark ? 'rgba(148, 163, 184, 0.15)' : '#f1f5f9',
                border: '#cbd5e1',
                label: '2위 🥈'
            };
        }
        if (rank === 3) {
            return {
                icon: 'pi pi-trophy',
                color: '#d97706',
                bg: isDark ? 'rgba(217, 119, 6, 0.15)' : '#ffedd5',
                border: '#fed7aa',
                label: '3위 🥉'
            };
        }
        return {
            icon: 'pi pi-star-fill',
            color: '#6366f1',
            bg: isDark ? 'rgba(99, 102, 241, 0.15)' : '#e0e7ff',
            border: '#c7d2fe',
            label: `${rank}위`
        };
    };

    const cardBg = isDark
        ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
        : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)';

    const cardBorder = isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0';

    return (
        <Card
            className="mb-4 shadow-2 border-round-2xl overflow-hidden"
            style={{
                background: cardBg,
                border: cardBorder
            }}
        >
            <Tooltip target=".rank-tooltip" position="top" />

            {/* 카드 상단 타이틀 바 */}
            <div className="flex align-items-center justify-content-between pb-3 mb-3 border-bottom-1 surface-border">
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-trophy text-yellow-500 text-xl font-bold" />
                    <div>
                        <div className="flex align-items-center gap-2 flex-wrap">
                            <span className="font-bold text-base md:text-lg text-900">
                                {monthDisplayName} 순공 랭킹
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex align-items-center gap-2">
                    {lastUpdatedTime && (
                        <span className="text-xs text-400 hidden sm:inline">갱신: {lastUpdatedTime}</span>
                    )}
                    <Button
                        label="월별 순공 기록"
                        icon="pi pi-calendar"
                        size="small"
                        outlined
                        severity="secondary"
                        className="text-xs hidden md:inline-flex"
                        onClick={() => {
                            setMonthlyModalOpen(true);
                            fetchMonthlyHistory();
                        }}
                    />
                    <Button
                        icon="pi pi-calendar"
                        size="small"
                        text
                        rounded
                        severity="secondary"
                        className="inline-flex md:hidden"
                        tooltip="월별 기록 보기"
                        tooltipOptions={{ position: 'top' }}
                        onClick={() => {
                            setMonthlyModalOpen(true);
                            fetchMonthlyHistory();
                        }}
                    />
                    <Button
                        icon="pi pi-refresh"
                        size="small"
                        text
                        rounded
                        severity="secondary"
                        loading={loading}
                        onClick={fetchRankings}
                        tooltip="순위 새로고침"
                        tooltipOptions={{ position: 'top' }}
                    />
                </div>
            </div>

            {/* 2열 구조: 왼쪽 (나의 해당 월 순공시간 & 나의 순위) / 오른쪽 (해당 월 TOP 3 리더보드) */}
            <div className="grid">
                {/* 1. 나의 월별 순수 공부시간 요약 카드 */}
                <div className="col-12 md:col-5">
                    <div
                        className={`p-3 border-round-xl h-full flex flex-column justify-content-between ${
                            isDark ? 'surface-ground' : 'bg-green-50'
                        } border-1 ${isDark ? 'border-transparent' : 'border-green-200'}`}
                    >
                        <div>
                            <div className="flex align-items-center justify-content-between mb-2">
                                <div className="flex align-items-center gap-2 flex-wrap">
                                    <span className="font-bold text-sm text-700 flex align-items-center gap-1">
                                        <i className="pi pi-user text-green-600 text-xs" /> 나의 {monthDisplayName} 총
                                        순공시간
                                    </span>
                                    {myRank && myRank > 0 && effectiveMySeconds > 0 ? (
                                        <Tag
                                            value={myRank <= 3 ? getTrophyMeta(myRank).label : `${myRank}위`}
                                            style={{
                                                background: getTrophyMeta(myRank).bg,
                                                color: getTrophyMeta(myRank).color,
                                                border: `1px solid ${getTrophyMeta(myRank).border}`,
                                                fontSize: '11px',
                                                padding: '1px 6px'
                                            }}
                                            className="font-bold border-round-md"
                                        />
                                    ) : (
                                        <Tag
                                            value="집계 전"
                                            severity={null}
                                            className="text-xs px-2 py-0 border-round-md font-medium"
                                            style={{
                                                fontSize: '10px',
                                                background: isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9',
                                                color: isDark ? '#94a3b8' : '#64748b',
                                                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0'
                                            }}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* 나의 순수 공부시간 큰 글씨 */}
                            <div className="font-extrabold text-2xl md:text-3xl text-green-600 my-1">
                                {formatDuration(effectiveMySeconds)}
                            </div>
                            <span className="text-xs text-500 block">
                                {effectiveMySeconds > 0
                                    ? ''
                                    : `${monthDisplayName} 순공 기록이 아직 없습니다. 스톱워치로 시작해보세요!`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. 남의 순위 (해당 월 TOP 3 리더보드) */}
                <div className="col-12 md:col-7">
                    <div
                        className={`p-3 border-round-xl h-full flex flex-column justify-content-between ${
                            isDark ? 'surface-ground' : 'bg-gray-50'
                        }`}
                    >
                        {/* 1등, 2등, 3등 목록 */}
                        <div className="flex flex-column gap-2 mt-1">
                            {topRankers && topRankers.length > 0 ? (
                                topRankers.map((ranker) => {
                                    const meta = getTrophyMeta(ranker.rank);
                                    const isMe = ranker.studentId === studentId;

                                    return (
                                        <div
                                            key={ranker.studentId || ranker.rank}
                                            className={`flex align-items-center justify-content-between p-2 border-round-lg shadow-1 transition-transform ${
                                                isMe
                                                    ? isDark
                                                        ? 'border-1 border-green-500 surface-card'
                                                        : 'border-1 border-green-400 bg-green-50'
                                                    : isDark
                                                    ? 'surface-card'
                                                    : 'bg-white'
                                            }`}
                                        >
                                            {/* 왼쪽 순위 & 트로피 & 학생 정보 */}
                                            <div className="flex align-items-center gap-2 min-w-0">
                                                <div
                                                    className="flex align-items-center justify-content-center border-round-lg font-extrabold text-xs"
                                                    style={{
                                                        width: '28px',
                                                        height: '28px',
                                                        background: meta.bg,
                                                        color: meta.color,
                                                        border: `1px solid ${meta.border}`
                                                    }}
                                                >
                                                    {ranker.rank}위
                                                </div>

                                                <div className="flex flex-column min-w-0">
                                                    <div className="flex align-items-center gap-1">
                                                        <span className="font-bold text-sm text-900 white-space-nowrap">
                                                            {ranker.name}
                                                        </span>
                                                        {isMe && (
                                                            <Tag
                                                                value="나"
                                                                severity="success"
                                                                className="text-xs px-1 py-0 font-bold"
                                                                style={{ fontSize: '10px' }}
                                                            />
                                                        )}
                                                    </div>
                                                    {(ranker.school || ranker.grade) && (
                                                        <span
                                                            className="text-xs text-500 truncate"
                                                            style={{ fontSize: '11px' }}
                                                        >
                                                            {ranker.school ? `${ranker.school} ` : ''}
                                                            {ranker.grade ? `${ranker.grade}학년` : ''}
                                                            {ranker.studyDaysCount
                                                                ? ` (${ranker.studyDaysCount}일 참여)`
                                                                : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 오른쪽 순공시간 표시 */}
                                            <div className="text-right white-space-nowrap">
                                                <span className="font-bold text-sm text-primary">
                                                    {formatDuration(ranker.totalSeconds)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-4 text-500 text-xs">
                                    <i className="pi pi-sparkles text-yellow-500 text-xl block mb-2" />
                                    아직 {monthDisplayName}의 순공 기록이 없습니다.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. 월별 순공시간 전체 내역 팝업 (Dialog) */}
            <Dialog
                header={
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-calendar-plus text-primary text-xl" />
                        <span className="font-bold text-lg">월별 순공시간 기록</span>
                    </div>
                }
                visible={monthlyModalOpen}
                style={{ width: '90vw', maxWidth: '680px' }}
                modal
                dismissableMask
                onHide={() => setMonthlyModalOpen(false)}
                footer={
                    <div className="flex justify-content-end">
                        <Button
                            label="닫기"
                            icon="pi pi-check"
                            onClick={() => setMonthlyModalOpen(false)}
                            className="p-button-sm"
                        />
                    </div>
                }
            >
                <div className="p-1">
                    <DataTable
                        value={monthlyHistory}
                        loading={monthlyHistoryLoading}
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
                                    <span className="font-semibold text-900">
                                        {dayjs(rowData.month).format('YYYY년 M월')}
                                    </span>
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
                                <span className="text-700 font-medium">{rowData.studyDaysCount || 0}일</span>
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
                                <span className="text-500 text-sm">{rowData.sessionsCount || 0}회</span>
                            )}
                        />
                    </DataTable>
                </div>
            </Dialog>
        </Card>
    );
};

export default StudyRankingCard;
