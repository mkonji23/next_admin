'use client';

import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Tooltip } from 'primereact/tooltip';
import { LayoutContext } from '@/layout/context/layoutcontext';
import { useStudyStopwatch } from '@/hooks/useStudyStopwatch';
import { StudyEndReason } from '@/types/studyTime';
import dayjs from 'dayjs';

interface StudyStopwatchCardProps {
    studentId?: string;
    studentName?: string;
}

const StudyStopwatchCard: React.FC<StudyStopwatchCardProps> = ({ studentId, studentName }) => {
    const { layoutConfig } = useContext(LayoutContext);
    const isDark = layoutConfig?.colorScheme === 'dark';

    const [currentTime, setCurrentTime] = useState<dayjs.Dayjs>(dayjs());
    const [alertVisible, setAlertVisible] = useState<boolean>(false);
    const [alertReason, setAlertReason] = useState<StudyEndReason | null>(null);
    const [timelineVisible, setTimelineVisible] = useState<boolean>(false);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    // 실시간 현재시간 1초 주기 갱신
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(dayjs());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // 화면 이탈 콜백 메모이제이션 (불필요한 리렌더 및 훅 내부 루프 방지)
    const handleBackgroundPaused = useCallback((reason: StudyEndReason) => {
        setAlertReason(reason);
        setAlertVisible(true);
    }, []);

    const {
        loading,
        isRunning,
        todayTotalSeconds,
        overallTotalSeconds,
        currentSessionSeconds,
        todayData,
        startStudy,
        pauseStudy,
        formatTime
    } = useStudyStopwatch({
        studentId,
        onBackgroundPaused: handleBackgroundPaused
    });

    const activeTotalSeconds = todayTotalSeconds + (isRunning ? currentSessionSeconds : 0);
    const activeOverallSeconds = (overallTotalSeconds || 0) + (isRunning ? currentSessionSeconds : 0);
    const totalTimeDisplay = formatTime(activeTotalSeconds);

    // 초/분이 넘어갈 때 분/시간 단위 펄스 애니메이션 트리거 키
    const prevMinuteRef = useRef<string>(totalTimeDisplay.minutes);
    const prevHourRef = useRef<string>(totalTimeDisplay.hours);
    const [minutePulseKey, setMinutePulseKey] = useState<number>(0);
    const [hourPulseKey, setHourPulseKey] = useState<number>(0);

    useEffect(() => {
        if (!isRunning) {
            prevMinuteRef.current = totalTimeDisplay.minutes;
            prevHourRef.current = totalTimeDisplay.hours;
            return;
        }

        // 초가 59 -> 00으로 넘어가서 분이 변경되었을 때
        if (prevMinuteRef.current !== totalTimeDisplay.minutes) {
            setMinutePulseKey((prev) => prev + 1);
            prevMinuteRef.current = totalTimeDisplay.minutes;
        }

        // 분이 59 -> 00으로 넘어가서 시간이 변경되었을 때
        if (prevHourRef.current !== totalTimeDisplay.hours) {
            setHourPulseKey((prev) => prev + 1);
            prevHourRef.current = totalTimeDisplay.hours;
        }
    }, [isRunning, totalTimeDisplay.minutes, totalTimeDisplay.hours]);

    // 한국어 오전/오후 시간 포맷팅 헬퍼
    const formatKoreanTime = (dt: string | Date | dayjs.Dayjs | null | undefined, includeSeconds = false) => {
        if (!dt) return '-';
        const d = dayjs(dt);
        if (!d.isValid()) return '-';
        const hour24 = d.hour();
        const ampm = hour24 < 12 ? '오전' : '오후';
        const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
        const minute = d.format('mm');
        if (includeSeconds) {
            const second = d.format('ss');
            return `${ampm} ${hour12}:${minute}:${second}`;
        }
        return `${ampm} ${hour12}:${minute}`;
    };

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

    // 전체화면 진입 / 나가기 핸들러
    const openFullscreen = useCallback(() => {
        setIsFullscreen(true);
        if (typeof window !== 'undefined') {
            window.history.pushState({ popup: 'stopwatchFullscreen' }, '');
            try {
                document.documentElement.requestFullscreen?.().catch(() => {});
            } catch (_) {}
        }
    }, []);

    const closeFullscreen = useCallback(() => {
        setIsFullscreen(false);
        if (typeof window !== 'undefined') {
            if (window.history.state?.popup === 'stopwatchFullscreen') {
                window.history.back();
            }
            if (document.fullscreenElement) {
                try {
                    document.exitFullscreen?.().catch(() => {});
                } catch (_) {}
            }
        }
    }, []);

    // 모바일 뒤로가기 버튼 처리
    useEffect(() => {
        const handlePopState = () => {
            if (isFullscreen) {
                setIsFullscreen(false);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isFullscreen]);

    // 공부 시작 클릭 시: 스톱워치 가동 + 전체화면 모드 자동 전환
    const handleStartStudy = () => {
        startStudy();
        openFullscreen();
    };

    // 시간 또는 태그 클릭 시 공부 시작/일시정지 토글
    const handleToggleStudy = () => {
        if (loading || !studentId) return;
        if (isRunning) {
            pauseStudy('manual_pause');
        } else {
            if (isFullscreen) {
                startStudy();
            } else {
                handleStartStudy();
            }
        }
    };

    const is1hAutoPaused = alertReason === 'auto_1h_pause';

    // 라이트 / 다크 테마별 스타일 정의
    const cardBg = isDark
        ? isRunning
            ? 'linear-gradient(135deg, #143522 0%, #0d2318 60%, #052e16 100%)'
            : 'linear-gradient(135deg, #1e293b 0%, #0f172a 60%, #1e1b4b 100%)'
        : isRunning
        ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 60%, #ecfdf5 100%)'
        : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 60%, #f1f5f9 100%)';

    const cardBorder = isDark
        ? isRunning
            ? '1.5px solid rgba(34,197,94,0.35)'
            : '1.5px solid rgba(99,102,241,0.25)'
        : isRunning
        ? '1.5px solid #86efac'
        : '1.5px solid #e2e8f0';

    const titleColor = isDark ? '#f1f5f9' : '#0f172a';
    const subtitleColor = isDark ? '#94a3b8' : '#64748b';
    const headerBorderColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

    const clockBg = isDark ? 'rgba(0,0,0,0.3)' : isRunning ? 'rgba(255,255,255,0.85)' : 'rgba(241,245,249,0.7)';
    const clockBorder = isDark
        ? isRunning
            ? '1px solid rgba(34,197,94,0.35)'
            : '1px solid rgba(255,255,255,0.08)'
        : isRunning
        ? '1.5px solid #86efac'
        : '1px solid #e2e8f0';
    const clockTextColor = isDark ? (isRunning ? '#4ade80' : '#e2e8f0') : isRunning ? '#15803d' : '#1e293b';

    const statsBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)';
    const statsBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
    const statsTextColor = isDark ? '#cbd5e1' : '#1e293b';

    return (
        <>
            <Card
                className="mb-4 shadow-3 border-round-2xl overflow-hidden"
                style={{
                    background: cardBg,
                    border: cardBorder,
                    transition: 'background 0.5s ease, border 0.5s ease'
                }}
            >
                <Tooltip target=".stopwatch-info-tooltip" position="top" />
                <style>{`
                    @keyframes pulse-ring {
                        0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
                        70% { box-shadow: 0 0 0 16px rgba(34,197,94,0); }
                        100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
                    }
                    .stopwatch-running-glow {
                        animation: pulse-ring 2s infinite;
                    }
                    .stopwatch-start-btn {
                        font-size: 1.15rem !important;
                        padding: 1rem 2rem !important;
                        border-radius: 2rem !important;
                        letter-spacing: 0.05em;
                        box-shadow: 0 4px 20px rgba(22,163,74,0.3) !important;
                        transition: transform 0.15s, box-shadow 0.15s !important;
                    }
                    .stopwatch-start-btn:not(:disabled):hover {
                        transform: scale(1.03);
                        box-shadow: 0 6px 28px rgba(22,163,74,0.45) !important;
                    }
                    .stopwatch-pause-btn {
                        font-size: 1.05rem !important;
                        padding: 0.85rem 1.8rem !important;
                        border-radius: 2rem !important;
                        box-shadow: 0 4px 20px rgba(234,179,8,0.3) !important;
                    }
                    @keyframes second-pop-dark {
                        0% {
                            transform: scale(1.08);
                            filter: brightness(1.4) drop-shadow(0 0 24px rgba(74, 222, 128, 0.95));
                            color: #86efac;
                        }
                        45% {
                            transform: scale(1.02);
                            filter: brightness(1.15) drop-shadow(0 0 10px rgba(74, 222, 128, 0.5));
                        }
                        100% {
                            transform: scale(1);
                            filter: brightness(1);
                            color: inherit;
                        }
                    }
                    @keyframes second-pop-light {
                        0% {
                            transform: scale(1.08);
                            filter: drop-shadow(0 0 18px rgba(22, 163, 74, 0.85));
                            color: #16a34a;
                        }
                        45% {
                            transform: scale(1.02);
                            filter: drop-shadow(0 0 8px rgba(22, 163, 74, 0.45));
                        }
                        100% {
                            transform: scale(1);
                            color: inherit;
                        }
                    }
                    @keyframes fullscreen-colon-pulse {
                        0%, 100% {
                            opacity: 1;
                            transform: scale(1);
                        }
                        50% {
                            opacity: 0.25;
                            transform: scale(0.92);
                        }
                    }
                    .second-tick-highlight-dark {
                        animation: second-pop-dark 0.85s cubic-bezier(0.2, 0.9, 0.3, 1) forwards;
                        transform-origin: center center;
                        will-change: transform, filter, color;
                    }
                    .second-tick-highlight-light {
                        animation: second-pop-light 0.85s cubic-bezier(0.2, 0.9, 0.3, 1) forwards;
                        transform-origin: center center;
                        will-change: transform, filter, color;
                    }
                    .fullscreen-colon-blink {
                        animation: fullscreen-colon-pulse 1s infinite ease-in-out;
                        display: inline-block;
                    }
                    /* 분 변경 펄스 애니메이션 (초가 59->00으로 넘어갈 때) */
                    @keyframes minute-pop-dark {
                        0% {
                            transform: scale(1.18);
                            filter: brightness(1.6) drop-shadow(0 0 35px rgba(52, 211, 153, 1));
                            color: #6ee7b7;
                        }
                        40% {
                            transform: scale(1.06);
                            filter: brightness(1.3) drop-shadow(0 0 16px rgba(52, 211, 153, 0.7));
                        }
                        100% {
                            transform: scale(1);
                            filter: brightness(1);
                            color: inherit;
                        }
                    }
                    @keyframes minute-pop-light {
                        0% {
                            transform: scale(1.18);
                            filter: drop-shadow(0 0 25px rgba(16, 185, 129, 0.95));
                            color: #059669;
                        }
                        40% {
                            transform: scale(1.06);
                            filter: drop-shadow(0 0 12px rgba(16, 185, 129, 0.5));
                        }
                        100% {
                            transform: scale(1);
                            color: inherit;
                        }
                    }
                    .minute-tick-highlight-dark {
                        animation: minute-pop-dark 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                        transform-origin: center center;
                        display: inline-block;
                        will-change: transform, filter, color;
                    }
                    .minute-tick-highlight-light {
                        animation: minute-pop-light 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                        transform-origin: center center;
                        display: inline-block;
                        will-change: transform, filter, color;
                    }
                    /* 시간 변경 펄스 애니메이션 (분이 59->00으로 넘어갈 때) */
                    @keyframes hour-pop-dark {
                        0% {
                            transform: scale(1.24);
                            filter: brightness(1.7) drop-shadow(0 0 45px rgba(250, 204, 21, 1)) drop-shadow(0 0 70px rgba(234, 179, 8, 0.8));
                            color: #fef08a;
                        }
                        35% {
                            transform: scale(1.08);
                            filter: brightness(1.4) drop-shadow(0 0 24px rgba(250, 204, 21, 0.7));
                        }
                        100% {
                            transform: scale(1);
                            filter: brightness(1);
                            color: inherit;
                        }
                    }
                    @keyframes hour-pop-light {
                        0% {
                            transform: scale(1.24);
                            filter: drop-shadow(0 0 35px rgba(217, 119, 6, 1));
                            color: #d97706;
                        }
                        35% {
                            transform: scale(1.08);
                            filter: drop-shadow(0 0 16px rgba(217, 119, 6, 0.6));
                        }
                        100% {
                            transform: scale(1);
                            color: inherit;
                        }
                    }
                    .hour-tick-highlight-dark {
                        animation: hour-pop-dark 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                        transform-origin: center center;
                        display: inline-block;
                        will-change: transform, filter, color;
                    }
                    .hour-tick-highlight-light {
                        animation: hour-pop-light 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                        transform-origin: center center;
                        display: inline-block;
                        will-change: transform, filter, color;
                    }
                `}</style>
                <div className="flex flex-column gap-3">
                    {/* 상단 헤더: 타이틀, 전체 총 공부시간, 현재시간 & 상태 태그, 전체화면 버튼 */}
                    <div
                        className="flex align-items-center justify-content-between pb-2"
                        style={{ borderBottom: `1px solid ${headerBorderColor}` }}
                    >
                        <div className="flex flex-column gap-1">
                            <div className="flex flex-wrap align-items-baseline gap-2">
                                <div
                                    className="flex align-items-center gap-2 stopwatch-info-tooltip cursor-pointer"
                                    data-pr-tooltip="방치 방지를 위해 최대 1시간 연속 측정 후 자동 일시정지되며, 재실행이 필요합니다."
                                >
                                    <i
                                        className="pi pi-stopwatch text-xl"
                                        style={{
                                            color: isRunning
                                                ? isDark
                                                    ? '#4ade80'
                                                    : '#16a34a'
                                                : isDark
                                                ? '#818cf8'
                                                : '#6366f1'
                                        }}
                                    />
                                    <span className="font-bold text-lg" style={{ color: titleColor }}>
                                        순공 타이머
                                    </span>
                                </div>
                                <span className="text-xs font-normal" style={{ color: subtitleColor }}>
                                    (전체 {formatDurationText(activeOverallSeconds)})
                                </span>
                            </div>
                            {/* 현재 시간 표시 */}
                            <div className="flex align-items-center gap-1 text-xs" style={{ color: subtitleColor }}>
                                <i
                                    className="pi pi-clock text-xs"
                                    style={{
                                        color: isRunning
                                            ? isDark
                                                ? '#4ade80'
                                                : '#16a34a'
                                            : isDark
                                            ? '#818cf8'
                                            : '#6366f1'
                                    }}
                                />
                                <span>
                                    현재 시간:{' '}
                                    <strong style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>
                                        {formatKoreanTime(currentTime, false)}
                                    </strong>
                                </span>
                            </div>
                        </div>

                        <div className="flex align-items-center gap-2">
                            <div
                                onClick={handleToggleStudy}
                                className="cursor-pointer select-none transition-transform active:scale-95"
                                title={isRunning ? '클릭하여 일시정지' : '클릭하여 공부 시작'}
                            >
                                {isRunning ? (
                                    <Tag
                                        severity="success"
                                        value="집중"
                                        className="font-bold px-2 py-1 cursor-pointer"
                                        style={{ fontSize: '11px', background: '#16a34a', border: 'none' }}
                                    />
                                ) : (
                                    <Tag
                                        severity={null}
                                        value="일시정지"
                                        className="font-medium px-2 py-1 cursor-pointer"
                                        style={{
                                            fontSize: '11px',
                                            background: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                                            color: isDark ? '#94a3b8' : '#475569'
                                        }}
                                    />
                                )}
                            </div>
                            <Button
                                icon="pi pi-expand"
                                size="small"
                                text
                                rounded
                                style={{ color: subtitleColor }}
                                tooltip="전체화면 몰입 모드"
                                tooltipOptions={{ position: 'top' }}
                                onClick={openFullscreen}
                            />
                            <Button
                                icon="pi pi-list"
                                size="small"
                                text
                                rounded
                                style={{ color: subtitleColor }}
                                tooltip="오늘의 공부 타임라인"
                                tooltipOptions={{ position: 'top' }}
                                onClick={() => setTimelineVisible(true)}
                            />
                        </div>
                    </div>

                    {/* 중앙: 대형 스톱워치 디스플레이 */}
                    <div
                        className={`flex flex-column align-items-center justify-content-center py-3 border-round-xl cursor-pointer select-none transition-all transition-duration-200 ${
                            isRunning ? 'stopwatch-running-glow hover:shadow-3' : 'hover:surface-100 hover:shadow-2'
                        }`}
                        style={{
                            background: clockBg,
                            border: clockBorder,
                            transition: 'all 0.3s ease',
                            cursor: !studentId || loading ? 'not-allowed' : 'pointer'
                        }}
                        onClick={handleToggleStudy}
                        title={isRunning ? '클릭하여 일시정지' : '클릭하여 공부 시작'}
                    >
                        <div
                            className="font-extrabold font-mono transition-transform active:scale-95"
                            style={{
                                fontSize: 'clamp(2.5rem, 10vw, 4rem)',
                                letterSpacing: '4px',
                                color: clockTextColor,
                                textShadow: isRunning
                                    ? isDark
                                        ? '0 0 20px rgba(74,222,128,0.5)'
                                        : '0 2px 10px rgba(22,163,74,0.25)'
                                    : 'none',
                                transition: 'color 0.5s, text-shadow 0.5s'
                            }}
                        >
                            {totalTimeDisplay.formatted}
                        </div>
                        <span
                            className="text-xs mt-1 stopwatch-info-tooltip flex align-items-center gap-1"
                            style={{ color: subtitleColor, letterSpacing: '0.05em' }}
                            data-pr-tooltip="최대 1시간 연속 측정 후 자동 일시정지 (클릭 시 공부 시작/일시정지)"
                        >
                            오늘 누적 공부시간 <i className="pi pi-info-circle text-xs" />
                        </span>
                    </div>

                    {/* 하단 컨트롤 버튼 */}
                    <div className="flex justify-content-center gap-3">
                        {!isRunning ? (
                            <Button
                                label="공부 시작"
                                icon="pi pi-play"
                                className="stopwatch-start-btn w-full font-bold"
                                style={{
                                    background: 'linear-gradient(135deg, #16a34a, #15803d)',
                                    border: 'none',
                                    color: '#fff',
                                    maxWidth: '20rem'
                                }}
                                onClick={handleStartStudy}
                                disabled={loading || !studentId}
                                tooltip="클릭 시 전체화면 집중 모드로 전환됩니다. (최대 1시간 측정)"
                                tooltipOptions={{ position: 'top' }}
                            />
                        ) : (
                            <Button
                                label="일시정지"
                                icon="pi pi-pause"
                                severity="warning"
                                className="stopwatch-pause-btn w-full font-bold"
                                style={{ maxWidth: '20rem' }}
                                onClick={() => pauseStudy('manual_pause')}
                            />
                        )}
                    </div>

                    {/* 하단 통계 정보 (최초 시작, 최종 종료, 세션 수) */}
                    <div
                        className="grid grid-nogutter border-round-xl p-2 mt-1 text-center text-xs"
                        style={{ background: statsBg, border: `1px solid ${statsBorder}` }}
                    >
                        <div className="col-4" style={{ borderRight: `1px solid ${statsBorder}` }}>
                            <span className="block mb-1" style={{ color: subtitleColor }}>
                                첫 시작
                            </span>
                            <strong style={{ color: statsTextColor, fontSize: '0.75rem' }}>
                                {formatKoreanTime(todayData?.firstStartedAt)}
                            </strong>
                        </div>
                        <div className="col-4" style={{ borderRight: `1px solid ${statsBorder}` }}>
                            <span className="block mb-1" style={{ color: subtitleColor }}>
                                마지막 종료
                            </span>
                            <strong style={{ color: statsTextColor, fontSize: '0.75rem' }}>
                                {formatKoreanTime(todayData?.lastEndedAt)}
                            </strong>
                        </div>
                        <div className="col-4">
                            <span className="block mb-1" style={{ color: subtitleColor }}>
                                집중 세션
                            </span>
                            <strong style={{ color: isDark ? '#818cf8' : '#4f46e5', fontSize: '0.75rem' }}>
                                {todayData?.sessionsCount || 0}회
                            </strong>
                        </div>
                    </div>
                </div>
            </Card>

            {/* 🖥️ [전체 화면 몰입형 스톱워치 뷰] */}
            {isFullscreen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        zIndex: 9990,
                        background: isDark
                            ? isRunning
                                ? 'radial-gradient(circle at center, #112d1b 0%, #06150b 60%, #020704 100%)'
                                : 'radial-gradient(circle at center, #1e293b 0%, #0f172a 60%, #030712 100%)'
                            : isRunning
                            ? 'radial-gradient(circle at center, #f0fdf4 0%, #dcfce7 70%, #bbf7d0 100%)'
                            : 'radial-gradient(circle at center, #ffffff 0%, #f8fafc 70%, #e2e8f0 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: 'clamp(1rem, 4vw, 2.5rem)',
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        transition: 'background 0.6s ease'
                    }}
                >
                    {/* 전체화면 상단 바 */}
                    <div className="flex align-items-center justify-content-between w-full">
                        <div className="flex align-items-center gap-2">
                            <div
                                className="flex align-items-center gap-2 px-3 py-1 border-round-3xl"
                                style={{
                                    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                                    color: isDark ? '#f1f5f9' : '#0f172a'
                                }}
                            >
                                <i className="pi pi-user text-sm" />
                                <span className="font-bold text-sm">
                                    {studentName ? `${studentName} 학생의 순공 모드` : '순공 집중 모드'}
                                </span>
                            </div>
                        </div>

                        {/* 중앙 현재 시간 (태블릿/PC) */}
                        <div
                            className="hidden md:flex align-items-center gap-2 px-3 py-1 border-round-3xl text-sm"
                            style={{
                                background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                                color: subtitleColor
                            }}
                        >
                            <i className="pi pi-clock" />
                            <span>
                                현재 시간:{' '}
                                <strong style={{ color: titleColor }}>{formatKoreanTime(currentTime, true)}</strong>
                            </span>
                        </div>

                        {/* 우측 닫기 / 축소 버튼 */}
                        <div className="flex align-items-center gap-2">
                            <Button
                                icon="pi pi-window-minimize"
                                label="축소 보기"
                                className="p-button-sm border-round-3xl font-semibold"
                                style={{
                                    background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)',
                                    color: isDark ? '#e2e8f0' : '#1e293b',
                                    border: 'none'
                                }}
                                onClick={closeFullscreen}
                            />
                        </div>
                    </div>

                    {/* 전체화면 중앙: 초대형 시계 & 상태 */}
                    <div className="flex flex-column align-items-center justify-content-center my-auto text-center">
                        <div
                            className="mb-3 cursor-pointer select-none transition-transform active:scale-95"
                            onClick={handleToggleStudy}
                            title={isRunning ? '클릭하여 일시정지' : '클릭하여 공부 시작'}
                        >
                            {isRunning ? (
                                <Tag
                                    severity="success"
                                    value="공부 중"
                                    className="font-bold px-3 py-2 text-sm shadow-2 cursor-pointer"
                                    style={{
                                        background: '#16a34a',
                                        letterSpacing: '1px'
                                    }}
                                />
                            ) : (
                                <Tag
                                    severity={null}
                                    value="일시정지"
                                    className="font-bold px-3 py-2 text-sm cursor-pointer"
                                    style={{
                                        background: isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1',
                                        color: isDark ? '#e2e8f0' : '#334155'
                                    }}
                                />
                            )}
                        </div>

                        {/* 초대형 스톱워치 텍스트 (초마다 리드미컬 하이라이트) */}
                        <div
                            className="font-extrabold font-mono select-none cursor-pointer flex align-items-center justify-content-center flex-nowrap"
                            style={{
                                fontSize: 'clamp(4.2rem, 18vw, 11rem)',
                                lineHeight: '1',
                                letterSpacing: 'clamp(2px, 1.2vw, 8px)',
                                color: clockTextColor,
                                textShadow: isRunning
                                    ? isDark
                                        ? '0 0 40px rgba(74,222,128,0.5), 0 0 80px rgba(34,197,94,0.25)'
                                        : '0 4px 20px rgba(22,163,74,0.3)'
                                    : 'none',
                                transition: 'color 0.5s, text-shadow 0.5s'
                            }}
                            onClick={handleToggleStudy}
                            title={isRunning ? '클릭하여 일시정지' : '클릭하여 공부 시작'}
                        >
                            <span
                                key={isRunning && hourPulseKey > 0 ? `hour-${hourPulseKey}` : 'hour-idle'}
                                className={
                                    isRunning && hourPulseKey > 0
                                        ? isDark
                                            ? 'hour-tick-highlight-dark'
                                            : 'hour-tick-highlight-light'
                                        : ''
                                }
                                style={{ display: 'inline-block' }}
                            >
                                {totalTimeDisplay.hours}
                            </span>
                            <span className={isRunning ? 'fullscreen-colon-blink mx-1' : 'mx-1'}>:</span>
                            <span
                                key={isRunning && minutePulseKey > 0 ? `min-${minutePulseKey}` : 'min-idle'}
                                className={
                                    isRunning && minutePulseKey > 0
                                        ? isDark
                                            ? 'minute-tick-highlight-dark'
                                            : 'minute-tick-highlight-light'
                                        : ''
                                }
                                style={{ display: 'inline-block' }}
                            >
                                {totalTimeDisplay.minutes}
                            </span>
                            <span className={isRunning ? 'fullscreen-colon-blink mx-1' : 'mx-1'}>:</span>
                            <span
                                key={isRunning ? totalTimeDisplay.seconds : 'paused'}
                                className={
                                    isRunning
                                        ? isDark
                                            ? 'second-tick-highlight-dark'
                                            : 'second-tick-highlight-light'
                                        : ''
                                }
                                style={{ display: 'inline-block' }}
                            >
                                {totalTimeDisplay.seconds}
                            </span>
                        </div>

                        {/* 전체 총 공부시간 및 세션 요약 */}
                        <div className="flex flex-wrap align-items-center justify-content-center gap-3 mt-4">
                            <span
                                className="text-sm font-semibold px-3 py-1 border-round-2xl"
                                style={{
                                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                    color: subtitleColor
                                }}
                            >
                                오늘 누적 총 공부시간:{' '}
                                <strong style={{ color: titleColor }}>{formatDurationText(activeTotalSeconds)}</strong>
                            </span>
                            <span
                                className="text-sm font-semibold px-3 py-1 border-round-2xl"
                                style={{
                                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                    color: subtitleColor
                                }}
                            >
                                오늘 집중 세션:{' '}
                                <strong style={{ color: isDark ? '#818cf8' : '#4f46e5' }}>
                                    {todayData?.sessionsCount || 0}회
                                </strong>
                            </span>
                        </div>
                    </div>

                    {/* 전체화면 하단 컨트롤 버튼 */}
                    <div className="flex flex-column align-items-center gap-3 w-full">
                        <div className="flex justify-content-center w-full" style={{ maxWidth: '420px' }}>
                            {!isRunning ? (
                                <Button
                                    label="공부 시작"
                                    icon="pi pi-play"
                                    className="w-full font-extrabold py-3 shadow-4 border-round-3xl text-lg"
                                    style={{
                                        background: 'linear-gradient(135deg, #16a34a, #15803d)',
                                        border: 'none',
                                        color: '#fff'
                                    }}
                                    onClick={startStudy}
                                    disabled={loading || !studentId}
                                />
                            ) : (
                                <Button
                                    label="일시정지"
                                    icon="pi pi-pause"
                                    severity="warning"
                                    className="w-full font-extrabold py-3 shadow-4 border-round-3xl text-lg"
                                    style={{
                                        background: 'linear-gradient(135deg, #eab308, #ca8a04)',
                                        border: 'none',
                                        color: '#fff'
                                    }}
                                    onClick={() => pauseStudy('manual_pause')}
                                />
                            )}
                        </div>

                        <div className="flex align-items-center gap-2 text-xs" style={{ color: subtitleColor }}>
                            <i className="pi pi-info-circle text-xs" />
                            <span>방치 방지를 위해 최대 1시간 연속 측정 후 자동 일시정지됩니다.</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 자동 일시정지 알림 팝업 */}
            <Dialog
                visible={alertVisible}
                onHide={() => setAlertVisible(false)}
                header={is1hAutoPaused ? '1시간 연속 공부 안내' : '화면 이탈 감지'}
                style={{ width: '90vw', maxWidth: '380px' }}
                modal
                footer={
                    <Button
                        label="다시 집중하기"
                        icon="pi pi-play"
                        severity="success"
                        className="w-full font-bold"
                        onClick={() => {
                            setAlertVisible(false);
                            handleStartStudy();
                        }}
                    />
                }
            >
                <div className="flex flex-column align-items-center text-center gap-2 py-2">
                    {is1hAutoPaused ? (
                        <>
                            <i className="pi pi-clock text-green-500 text-4xl mb-1" />
                            <span className="font-bold text-base text-900">1시간 집중을 완료했습니다!</span>
                            <p className="text-xs text-600 m-0 line-height-3">
                                방치 방지를 위해 스톱워치가 1시간 후 자동으로 일시정지되었습니다.
                                <br />
                                잠시 스트레칭 후 이어서 공부하려면 아래 버튼을 눌러주세요.
                            </p>
                        </>
                    ) : (
                        <>
                            <i className="pi pi-exclamation-triangle text-yellow-500 text-4xl mb-1" />
                            <span className="font-bold text-base text-900">스톱워치가 자동으로 멈췄습니다!</span>
                            <p className="text-xs text-600 m-0 line-height-3">
                                모바일 화면을 끄거나 다른 앱으로 전환하면
                                <br />
                                순수 공부시간 측정이 자동으로 중단됩니다.
                                <br />
                                공부를 다시 시작하려면 아래 버튼을 눌러주세요.
                            </p>
                        </>
                    )}
                </div>
            </Dialog>

            {/* 오늘의 순공 타임라인 다이얼로그 */}
            <Dialog
                visible={timelineVisible}
                onHide={() => setTimelineVisible(false)}
                header={
                    <div className="flex align-items-center justify-content-between pr-3">
                        <span className="font-bold text-base">오늘의 순공 타임라인</span>
                    </div>
                }
                style={{ width: '90vw', maxWidth: '460px' }}
                modal
            >
                {/* 타임라인 상단 요약 바 */}
                <div className="flex align-items-center justify-content-between p-2 mb-2 surface-100 border-round text-xs font-semibold">
                    <span className="text-600">오늘 누적 공부시간</span>
                    <span className="text-primary font-bold text-sm">총 {formatDurationText(activeTotalSeconds)}</span>
                </div>

                <div className="flex flex-column gap-2 pt-1 max-h-20rem overflow-y-auto">
                    {todayData?.sessions && todayData.sessions.length > 0 ? (
                        todayData.sessions.map((sess, idx) => {
                            const isPausedByLeave = sess.endReason === 'background_leave';
                            const isAuto1h = sess.endReason === 'auto_1h_pause';
                            return (
                                <div
                                    key={sess.sessionId || idx}
                                    className="flex align-items-center justify-content-between p-2 border-round surface-50 border-1 surface-border gap-2"
                                >
                                    <div className="flex align-items-center gap-2">
                                        <span className="text-xs font-bold text-primary w-2rem text-center">
                                            #{idx + 1}
                                        </span>
                                        <div className="flex flex-column">
                                            {/* 시작 ~ 종료 시간 (오전/오후) */}
                                            <span className="text-xs text-700 font-semibold">
                                                {formatKoreanTime(sess.startedAt)} ~{' '}
                                                {sess.endedAt ? formatKoreanTime(sess.endedAt) : '진행 중'}
                                            </span>
                                            {isPausedByLeave && (
                                                <span className="text-orange-600" style={{ fontSize: '10px' }}>
                                                    * 화면 이탈로 자동 중지
                                                </span>
                                            )}
                                            {isAuto1h && (
                                                <span className="text-green-600" style={{ fontSize: '10px' }}>
                                                    * 1시간 경과로 자동 일시정지
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* 오른쪽: 총 공부시간 한글 텍스트 */}
                                    <div className="text-right white-space-nowrap">
                                        <Tag
                                            value={`총 ${formatDurationText(sess.durationSeconds)}`}
                                            severity="info"
                                            className="font-bold text-xs px-2 py-1"
                                        />
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-4 text-500 text-sm">아직 오늘의 공부 기록이 없습니다.</div>
                    )}
                </div>
            </Dialog>
        </>
    );
};

export default StudyStopwatchCard;
