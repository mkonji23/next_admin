'use client';

import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Tooltip } from 'primereact/tooltip';
import { LayoutContext } from '@/layout/context/layoutcontext';
import { useHttp } from '@/util/axiosInstance';
import dayjs, { Dayjs } from 'dayjs';
import MonthlyStudyHistoryModal from './modals/MonthlyStudyHistoryModal';

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
    isMe?: boolean;
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

    // 월별 순공시간 목록 팝업(Modal) 상태
    const [monthlyModalOpen, setMonthlyModalOpen] = useState<boolean>(false);

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

    // 내가 3등 안에 드는지 확인
    const isMeInTop3 = topRankers.some((r) => r.studentId === studentId);

    // 내 데이터 항목 객체
    const myItem: RankingUser = {
        rank: myRank || 0,
        studentId: studentId || '',
        name: studentName || '나',
        totalSeconds: effectiveMySeconds,
        isMe: true
    };

    // 랭킹 리스트 구성: 3등 안에 안 들면 내 데이터를 맨 앞에 추가하여 4개 표시, 3등 안이면 3개 표시
    let displayRankings: RankingUser[] = [];

    if (topRankers.length === 0 && effectiveMySeconds <= 0) {
        displayRankings = [];
    } else if (isMeInTop3) {
        // 이미 내가 3위 안에 든 경우: TOP 3 그대로 3개 표시 (내가 속한 행은 isMe: true)
        displayRankings = topRankers.map((r) => ({
            ...r,
            isMe: r.studentId === studentId,
            totalSeconds: r.studentId === studentId ? effectiveMySeconds : r.totalSeconds
        }));
    } else {
        // 내가 3등 안에 안 들면: 내 데이터를 첫 번째 라인에 두고, 그 아래에 1, 2, 3등 표시 (총 4개)
        displayRankings = [
            myItem,
            ...topRankers.map((r) => ({ ...r, isMe: false }))
        ];
    }

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
                    <span className="font-bold text-base md:text-lg text-900">
                        {monthDisplayName} 순공 랭킹
                    </span>
                    <Tag
                        severity="info"
                        value={`${monthDisplayName} 누적`}
                        className="text-xs px-2 py-0 border-round-lg font-bold"
                    />
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
                        onClick={() => setMonthlyModalOpen(true)}
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
                        onClick={() => setMonthlyModalOpen(true)}
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

            {/* 랭킹 리스트 */}
            <div className="flex flex-column gap-2">
                {displayRankings.length > 0 ? (
                    displayRankings.map((ranker, idx) => {
                        const meta = getTrophyMeta(ranker.rank);
                        const isMe = ranker.isMe;

                        return (
                            <div
                                key={ranker.studentId ? `${ranker.studentId}_${ranker.rank}` : `rank_${idx}`}
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
                                            width: '34px',
                                            height: '28px',
                                            background: meta.bg,
                                            color: meta.color,
                                            border: `1px solid ${meta.border}`
                                        }}
                                    >
                                        {ranker.rank > 0 ? `${ranker.rank}위` : '-'}
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
                                        {(ranker.school || ranker.grade || ranker.studyDaysCount) && (
                                            <span className="text-xs text-500 truncate" style={{ fontSize: '11px' }}>
                                                {ranker.school ? `${ranker.school} ` : ''}
                                                {ranker.grade ? `${ranker.grade}학년` : ''}
                                                {ranker.studyDaysCount ? ` (${ranker.studyDaysCount}일 참여)` : ''}
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
                        <br />
                        {monthDisplayName} 첫 번째 1위 주인공이 되어보세요! 🚀
                    </div>
                )}
            </div>

            {/* 분리된 월별 순공시간 전체 내역 모달 */}
            <MonthlyStudyHistoryModal
                visible={monthlyModalOpen}
                onHide={() => setMonthlyModalOpen(false)}
                studentId={studentId}
                studentName={studentName}
                targetMonthStr={targetMonthStr}
            />
        </Card>
    );
};

export default StudyRankingCard;
