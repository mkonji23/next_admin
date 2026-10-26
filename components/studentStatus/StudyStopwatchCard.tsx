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
import styles from '@/styles/modules/StudyStopwatchCard.module.css';

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

    // 전체화면 가로형/세로형 모드 관리 ('landscape' | 'portrait')
    type OrientationMode = 'landscape' | 'portrait';
    const [orientationMode, setOrientationMode] = useState<OrientationMode>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('stopwatch_orientation_mode');
            if (saved === 'portrait' || saved === 'landscape') return saved;
        }
        return 'landscape'; // 기본 탁상시계 몰입 모드: 가로형
    });
    const [isDeviceLandscape, setIsDeviceLandscape] = useState<boolean>(false);

    // 디바이스의 실제 회전 상태 실시간 감지
    useEffect(() => {
        const checkDeviceOrientation = () => {
            if (typeof window !== 'undefined') {
                setIsDeviceLandscape(window.innerWidth > window.innerHeight);
            }
        };
        checkDeviceOrientation();
        window.addEventListener('resize', checkDeviceOrientation);
        window.addEventListener('orientationchange', checkDeviceOrientation);
        return () => {
            window.removeEventListener('resize', checkDeviceOrientation);
            window.removeEventListener('orientationchange', checkDeviceOrientation);
        };
    }, []);

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
        formatTime,
        isWakeLockActive,
        suppressPauseTemporarily
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

    // 축소 모드 복귀 시 스크롤 위치를 스톱워치 카드로 이동시키기 위한 Ref
    const cardContainerRef = useRef<HTMLDivElement>(null);

    // 스톱워치 카드로 부드럽게 스크롤 이동
    const scrollToStopwatch = useCallback(() => {
        if (typeof window === 'undefined') return;

        const performScroll = () => {
            if (!cardContainerRef.current) return;
            const rect = cardContainerRef.current.getBoundingClientRect();
            // 상단 여백 20px 고려하여 스톱워치 카드가 시야에 완벽하게 들어오도록 위치 계산
            const targetTop = window.scrollY + rect.top - 20;
            window.scrollTo({
                top: Math.max(0, targetTop),
                behavior: 'smooth'
            });
        };

        // 모바일 가로/세로 전환 및 브라우저 UI 툴바 애니메이션 안정화 고려하여 3회 보장
        requestAnimationFrame(performScroll);
        setTimeout(performScroll, 100);
        setTimeout(performScroll, 300);
    }, []);

    // 가로형 / 세로형 모드 변경 및 Native Screen Orientation Lock 제어
    const changeOrientationMode = useCallback(async (mode: OrientationMode) => {
        setOrientationMode(mode);
        if (typeof window !== 'undefined') {
            localStorage.setItem('stopwatch_orientation_mode', mode);
            if (typeof screen !== 'undefined' && screen.orientation && typeof screen.orientation.lock === 'function') {
                try {
                    await screen.orientation.lock(mode);
                } catch (_) {
                    // 브라우저 정책으로 lock이 거부되어도 CSS Fallback 모드로 완벽 대응
                }
            }
        }
    }, []);

    // 전체화면 진입 / 나가기 핸들러
    const openFullscreen = useCallback(
        async (mode?: OrientationMode) => {
            const targetMode = mode || orientationMode;
            suppressPauseTemporarily(2500);
            setIsFullscreen(true);
            if (typeof window !== 'undefined') {
                window.history.pushState({ popup: 'stopwatchFullscreen' }, '');
                try {
                    await document.documentElement.requestFullscreen?.().catch(() => {});
                } catch (_) {}
                changeOrientationMode(targetMode);
            }
        },
        [orientationMode, suppressPauseTemporarily, changeOrientationMode]
    );

    const closeFullscreen = useCallback(() => {
        // 축소 모드 전환 중(가로/세로 회전, UI 복원, 히스토리 이동 등) 일시정지 오작동 방지
        suppressPauseTemporarily(2500);
        setIsFullscreen(false);
        if (typeof window !== 'undefined') {
            if (typeof screen !== 'undefined' && screen.orientation?.unlock) {
                try {
                    screen.orientation.unlock();
                } catch (_) {}
            }
            if (window.history.state?.popup === 'stopwatchFullscreen') {
                window.history.back();
            }
            if (document.fullscreenElement) {
                try {
                    document.exitFullscreen?.().catch(() => {});
                } catch (_) {}
            }
        }
        scrollToStopwatch();
    }, [suppressPauseTemporarily, scrollToStopwatch]);

    // 모바일 뒤로가기 버튼(popstate) 처리
    useEffect(() => {
        const handlePopState = () => {
            if (isFullscreen) {
                suppressPauseTemporarily(2500);
                setIsFullscreen(false);
                if (document.fullscreenElement) {
                    try {
                        document.exitFullscreen?.().catch(() => {});
                    } catch (_) {}
                }
                scrollToStopwatch();
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isFullscreen, suppressPauseTemporarily, scrollToStopwatch]);

    // 브라우저 자체 전체화면 변경(fullscreenchange - 제스처, ESC 등) 처리
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isDocFullscreen = Boolean(document.fullscreenElement);
            if (!isDocFullscreen && isFullscreen) {
                suppressPauseTemporarily(2500);
                setIsFullscreen(false);
                if (window.history.state?.popup === 'stopwatchFullscreen') {
                    window.history.back();
                }
                scrollToStopwatch();
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        };
    }, [isFullscreen, suppressPauseTemporarily, scrollToStopwatch]);

    // isFullscreen이 true -> false로 변경될 때 스크롤 복귀 보장
    const prevIsFullscreenRef = useRef(isFullscreen);
    useEffect(() => {
        if (prevIsFullscreenRef.current && !isFullscreen) {
            scrollToStopwatch();
        }
        prevIsFullscreenRef.current = isFullscreen;
    }, [isFullscreen, scrollToStopwatch]);

    // 공부 시작 클릭 시: 스톱워치 가동 + 전체화면 모드 자동 전환
    const handleStartStudy = () => {
        startStudy();
        openFullscreen();
    };

    const is1hAutoPaused = alertReason === 'auto_1h_pause';

    return (
        <>
            <div ref={cardContainerRef} className="w-full">
                <Card
                    className={`mb-4 shadow-3 border-round-2xl overflow-hidden ${styles.stopwatchCard}`}
                    data-theme={isDark ? 'dark' : 'light'}
                    data-running={isRunning}
                >
                    <Tooltip target=".stopwatch-info-tooltip" position="top" />
                    <div className="flex flex-column gap-3">
                        {/* 상단 헤더: 타이틀, 전체 총 공부시간, 현재시간 & 상태 태그, 전체화면 버튼 */}
                        <div className={`flex align-items-center justify-content-between pb-2 ${styles.cardHeader}`}>
                            <div className="flex flex-column gap-1">
                                <div className="flex flex-wrap align-items-baseline gap-2">
                                    <div
                                        className="flex align-items-center gap-2 stopwatch-info-tooltip cursor-pointer"
                                        data-pr-tooltip="방치 방지를 위해 최대 1시간 연속 측정 후 자동 일시정지되며, 재실행이 필요합니다."
                                    >
                                        <i className={`pi pi-stopwatch text-xl ${styles.cardIcon}`} />
                                        <span className={`font-bold text-lg ${styles.cardTitle}`}>순공 타이머</span>
                                    </div>
                                    <span className={`text-xs font-normal ${styles.cardSubtitle}`}>
                                        (전체 {formatDurationText(activeOverallSeconds)})
                                    </span>
                                </div>
                                {/* 현재 시간 표시 */}
                                <div className={`flex align-items-center gap-1 text-xs ${styles.cardSubtitle}`}>
                                    <i className={`pi pi-clock text-xs ${styles.cardIcon}`} />
                                    <span>
                                        현재 시간:{' '}
                                        <strong className={styles.currentTimeText}>
                                            {formatKoreanTime(currentTime, false)}
                                        </strong>
                                    </span>
                                </div>
                            </div>

                            <div className="flex align-items-center gap-2">
                                <div className="select-none">
                                    {isRunning ? (
                                        <Tag
                                            severity="success"
                                            value="집중"
                                            className="font-bold px-2 py-1 white-space-nowrap"
                                            style={{
                                                fontSize: '11px',
                                                background: '#16a34a',
                                                border: 'none',
                                                minWidth: '3.8rem',
                                                display: 'inline-flex',
                                                justifyContent: 'center',
                                                whiteSpace: 'nowrap'
                                            }}
                                        />
                                    ) : (
                                        <Tag
                                            severity={null}
                                            value="일시정지"
                                            className="font-medium px-2 py-1 white-space-nowrap"
                                            style={{
                                                fontSize: '11px',
                                                background: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                                                color: isDark ? '#94a3b8' : '#475569',
                                                minWidth: '3.8rem',
                                                display: 'inline-flex',
                                                justifyContent: 'center',
                                                whiteSpace: 'nowrap'
                                            }}
                                        />
                                    )}
                                </div>
                                <Button
                                    icon="pi pi-expand"
                                    size="small"
                                    text
                                    rounded
                                    className={styles.cardSubtitle}
                                    tooltipOptions={{ position: 'top' }}
                                    onClick={() => openFullscreen()}
                                />
                                <Button
                                    icon="pi pi-list"
                                    size="small"
                                    text
                                    rounded
                                    className={styles.cardSubtitle}
                                    tooltipOptions={{ position: 'top' }}
                                    onClick={() => setTimelineVisible(true)}
                                />
                            </div>
                        </div>

                        {/* 중앙: 대형 스톱워치 디스플레이 */}
                        <div
                            className={`flex flex-column align-items-center justify-content-center py-3 border-round-xl select-none transition-all transition-duration-200 ${
                                styles.clockContainer
                            } ${isRunning ? `${styles.runningGlow}` : ''}`}
                        >
                            <div
                                className={`font-extrabold font-mono ${styles.clockText}`}
                                style={{
                                    fontSize: 'clamp(2.5rem, 10vw, 4rem)',
                                    letterSpacing: '4px'
                                }}
                            >
                                {totalTimeDisplay.formatted}
                            </div>
                            <div className="flex align-items-center justify-content-center gap-1 mt-1">
                                <span
                                    className={`text-xs stopwatch-info-tooltip flex align-items-center gap-1 ${styles.cardSubtitle}`}
                                    style={{ letterSpacing: '0.05em' }}
                                    data-pr-tooltip="최대 1시간 연속 측정 후 자동 일시정지됩니다."
                                >
                                    오늘 누적 공부시간 <i className="pi pi-info-circle text-xs" />
                                </span>
                                {isRunning && (
                                    <span
                                        className="ml-2 inline-flex align-items-center justify-content-center cursor-pointer text-green-600 border-circle hover:surface-200 transition-colors"
                                        data-pr-tooltip="화면 켜짐 유지 중 (자동 잠금 방지)"
                                        style={{ width: '22px', height: '22px' }}
                                        title="화면 켜짐 유지 중 (자동 잠금 방지)"
                                    >
                                        <i className="pi pi-sun text-xs text-green-600" />
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* 하단 컨트롤 버튼 */}
                        <div className="flex justify-content-center gap-3">
                            {!isRunning ? (
                                <Button
                                    label="공부 시작"
                                    icon="pi pi-play"
                                    className={`${styles.startBtn} w-full font-bold`}
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
                                    className={`${styles.pauseBtn} w-full font-bold`}
                                    style={{ maxWidth: '20rem' }}
                                    onClick={() => pauseStudy('manual_pause')}
                                />
                            )}
                        </div>

                        {/* 하단 통계 정보 (최초 시작, 최종 종료, 세션 수) */}
                        <div
                            className={`grid grid-nogutter border-round-xl p-2 mt-1 text-center text-xs ${styles.statsContainer}`}
                        >
                            <div className={`col-4 ${styles.statsDivider}`}>
                                <span className={`block mb-1 ${styles.cardSubtitle}`}>첫 시작</span>
                                <strong className={`text-xs ${styles.statsValue}`}>
                                    {formatKoreanTime(todayData?.firstStartedAt)}
                                </strong>
                            </div>
                            <div className={`col-4 ${styles.statsDivider}`}>
                                <span className={`block mb-1 ${styles.cardSubtitle}`}>마지막 종료</span>
                                <strong className={`text-xs ${styles.statsValue}`}>
                                    {formatKoreanTime(todayData?.lastEndedAt)}
                                </strong>
                            </div>
                            <div className="col-4">
                                <span className={`block mb-1 ${styles.cardSubtitle}`}>집중 세션</span>
                                <strong style={{ color: isDark ? '#818cf8' : '#4f46e5', fontSize: '0.75rem' }}>
                                    {todayData?.sessionsCount || 0}회
                                </strong>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* 🖥️ [전체 화면 몰입형 스톱워치 뷰] */}
            {isFullscreen &&
                (() => {
                    // 기기가 세로인데 가로형을 선택했거나, 가로인데 세로형을 선택했을 때 스마트 CSS 회전 지원
                    const isForceLandscape = !isDeviceLandscape && orientationMode === 'landscape';
                    const isForcePortrait = isDeviceLandscape && orientationMode === 'portrait';
                    const rotationClass = isForceLandscape
                        ? styles.rotateLandscape
                        : isForcePortrait
                        ? styles.rotatePortrait
                        : '';

                    return (
                        <div
                            className={`${styles.fullscreenOverlay} ${rotationClass}`}
                            data-theme={isDark ? 'dark' : 'light'}
                            data-running={isRunning}
                            data-orientation={orientationMode}
                        >
                            {/* 전체화면 상단 바 */}
                            <div className="flex align-items-center justify-content-between w-full gap-2">
                                {/* 좌측: 학생 이름 (잘림 방지) & 화면 켜짐 유지 아이콘 */}
                                <div className="flex align-items-center gap-1 md:gap-2 flex-shrink-0">
                                    <div
                                        className="flex align-items-center gap-1 md:gap-2 px-2 md:px-3 py-1 border-round-3xl flex-shrink-0 white-space-nowrap"
                                        style={{
                                            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                                            color: isDark ? '#f1f5f9' : '#0f172a'
                                        }}
                                    >
                                        <i className="pi pi-user text-xs md:text-sm" />
                                        <span className="font-bold text-xs md:text-sm white-space-nowrap">
                                            {studentName ? `${studentName} 학생` : '순공 집중'}
                                        </span>
                                    </div>

                                    {/* 화면 켜짐 유지 중: 아이콘만 노출 + 툴팁 처리 */}
                                    {isRunning && (
                                        <div
                                            className="flex align-items-center justify-content-center border-circle cursor-pointer transition-colors flex-shrink-0"
                                            data-pr-tooltip="화면 켜짐 유지 중 (자동 잠금 방지)"
                                            title="화면 켜짐 유지 중 (자동 잠금 방지)"
                                            style={{
                                                width: '28px',
                                                height: '28px',
                                                background: isDark
                                                    ? 'rgba(34, 197, 94, 0.2)'
                                                    : 'rgba(34, 197, 94, 0.12)',
                                                color: isDark ? '#4ade80' : '#15803d',
                                                border: isDark
                                                    ? '1px solid rgba(74, 222, 128, 0.3)'
                                                    : '1px solid rgba(34, 197, 94, 0.25)'
                                            }}
                                        >
                                            <i className="pi pi-sun text-xs" />
                                        </div>
                                    )}
                                </div>

                                {/* 중앙 현재 시간 (모바일/태블릿/PC 모두 실시간 노출) */}
                                <div
                                    className="flex align-items-center gap-1 px-2 md:px-3 py-1 border-round-3xl text-xs md:text-sm flex-shrink-0 white-space-nowrap"
                                    style={{
                                        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'
                                    }}
                                >
                                    <i className="pi pi-clock text-xs" />
                                    <span className="hidden sm:inline">현재 시간: </span>
                                    <strong className={styles.cardTitle}>{formatKoreanTime(currentTime, true)}</strong>
                                </div>

                                {/* 우측: 가로형/세로형 선택 토글 (세로형일 땐 아이콘만, 가로형일 땐 텍스트 포함) & 축소 버튼 */}
                                <div className="flex align-items-center gap-1 md:gap-2 flex-shrink-0">
                                    <div
                                        className="flex align-items-center p-1 border-round-3xl"
                                        style={{
                                            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                                            gap: '2px'
                                        }}
                                    >
                                        <Button
                                            icon="pi pi-desktop"
                                            label={orientationMode === 'portrait' ? undefined : '가로형'}
                                            size="small"
                                            className="border-round-3xl text-xs font-bold"
                                            style={{
                                                padding: orientationMode === 'portrait' ? '4px 8px' : '4px 10px',
                                                height: '28px',
                                                fontSize: '11px',
                                                border: 'none',
                                                background:
                                                    orientationMode === 'landscape'
                                                        ? isDark
                                                            ? '#22c55e'
                                                            : '#16a34a'
                                                        : 'transparent',
                                                color:
                                                    orientationMode === 'landscape'
                                                        ? '#ffffff'
                                                        : isDark
                                                        ? '#94a3b8'
                                                        : '#64748b'
                                            }}
                                            onClick={() => changeOrientationMode('landscape')}
                                            tooltipOptions={{ position: 'bottom' }}
                                            aria-label="가로형"
                                        />
                                        <Button
                                            icon="pi pi-mobile"
                                            label={orientationMode === 'portrait' ? undefined : '세로형'}
                                            size="small"
                                            className="border-round-3xl text-xs font-bold"
                                            style={{
                                                padding: orientationMode === 'portrait' ? '4px 8px' : '4px 10px',
                                                height: '28px',
                                                fontSize: '11px',
                                                border: 'none',
                                                background:
                                                    orientationMode === 'portrait'
                                                        ? isDark
                                                            ? '#22c55e'
                                                            : '#16a34a'
                                                        : 'transparent',
                                                color:
                                                    orientationMode === 'portrait'
                                                        ? '#ffffff'
                                                        : isDark
                                                        ? '#94a3b8'
                                                        : '#64748b'
                                            }}
                                            onClick={() => changeOrientationMode('portrait')}
                                            tooltipOptions={{ position: 'bottom' }}
                                            aria-label="세로형"
                                        />
                                    </div>

                                    <Button
                                        icon="pi pi-window-minimize"
                                        rounded
                                        size="small"
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)',
                                            color: isDark ? '#e2e8f0' : '#1e293b',
                                            border: 'none'
                                        }}
                                        onClick={closeFullscreen}
                                        tooltipOptions={{ position: 'bottom' }}
                                        aria-label="축소 보기"
                                    />
                                </div>
                            </div>

                            {/* 전체화면 중앙: 초대형 시계 & 상태 */}
                            <div className="flex flex-column align-items-center justify-content-center my-auto text-center">
                                <div className="mb-3 select-none">
                                    {isRunning ? (
                                        <Tag
                                            severity="success"
                                            value="공부 중"
                                            className="font-bold px-4 py-2 text-sm shadow-2 white-space-nowrap"
                                            style={{
                                                background: '#16a34a',
                                                letterSpacing: '1px',
                                                minWidth: '6rem',
                                                display: 'inline-flex',
                                                justifyContent: 'center',
                                                textAlign: 'center',
                                                whiteSpace: 'nowrap'
                                            }}
                                        />
                                    ) : (
                                        <Tag
                                            severity={null}
                                            value="일시정지"
                                            className="font-bold px-4 py-2 text-sm white-space-nowrap"
                                            style={{
                                                background: isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1',
                                                color: isDark ? '#e2e8f0' : '#334155',
                                                minWidth: '6rem',
                                                display: 'inline-flex',
                                                justifyContent: 'center',
                                                textAlign: 'center',
                                                whiteSpace: 'nowrap'
                                            }}
                                        />
                                    )}
                                </div>

                                {/* 초대형 스톱워치 텍스트 (초마다 리드미컬 하이라이트) */}
                                <div
                                    className={`font-extrabold font-mono select-none flex align-items-center justify-content-center flex-nowrap ${styles.clockText}`}
                                    style={{
                                        fontSize:
                                            orientationMode === 'landscape'
                                                ? 'clamp(3.8rem, 16vh, 9.5rem)'
                                                : 'clamp(4.2rem, 18vw, 11rem)',
                                        lineHeight: '1',
                                        letterSpacing: 'clamp(2px, 1.2vw, 8px)'
                                    }}
                                >
                                    <span
                                        key={isRunning && hourPulseKey > 0 ? `hour-${hourPulseKey}` : 'hour-idle'}
                                        className={
                                            isRunning && hourPulseKey > 0
                                                ? isDark
                                                    ? styles.hourTickDark
                                                    : styles.hourTickLight
                                                : ''
                                        }
                                        style={{ display: 'inline-block' }}
                                    >
                                        {totalTimeDisplay.hours}
                                    </span>
                                    <span className={isRunning ? `${styles.colonBlink} mx-1` : 'mx-1'}>:</span>
                                    <span
                                        key={isRunning && minutePulseKey > 0 ? `min-${minutePulseKey}` : 'min-idle'}
                                        className={
                                            isRunning && minutePulseKey > 0
                                                ? isDark
                                                    ? styles.minuteTickDark
                                                    : styles.minuteTickLight
                                                : ''
                                        }
                                        style={{ display: 'inline-block' }}
                                    >
                                        {totalTimeDisplay.minutes}
                                    </span>
                                    <span className={isRunning ? `${styles.colonBlink} mx-1` : 'mx-1'}>:</span>
                                    <span
                                        key={isRunning ? totalTimeDisplay.seconds : 'paused'}
                                        className={
                                            isRunning ? (isDark ? styles.secondTickDark : styles.secondTickLight) : ''
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
                                            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
                                        }}
                                    >
                                        오늘 누적 총 공부시간:{' '}
                                        <strong className={styles.cardTitle}>
                                            {formatDurationText(activeTotalSeconds)}
                                        </strong>
                                    </span>
                                    <span
                                        className="text-sm font-semibold px-3 py-1 border-round-2xl"
                                        style={{
                                            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
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
                            <div className="flex flex-column align-items-center gap-2 md:gap-3 w-full">
                                <div className="flex justify-content-center w-full" style={{ maxWidth: '420px' }}>
                                    {!isRunning ? (
                                        <Button
                                            label="공부 시작"
                                            icon="pi pi-play"
                                            className="w-full font-extrabold py-2 md:py-3 shadow-4 border-round-3xl text-base md:text-lg"
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
                                            className="w-full font-extrabold py-2 md:py-3 shadow-4 border-round-3xl text-base md:text-lg"
                                            style={{
                                                background: 'linear-gradient(135deg, #eab308, #ca8a04)',
                                                border: 'none',
                                                color: '#fff'
                                            }}
                                            onClick={() => pauseStudy('manual_pause')}
                                        />
                                    )}
                                </div>

                                <div className={`flex align-items-center gap-2 text-xs ${styles.cardSubtitle}`}>
                                    <i className="pi pi-info-circle text-xs" />
                                    <span>방치 방지를 위해 최대 1시간 연속 측정 후 자동 일시정지됩니다.</span>
                                </div>
                            </div>
                        </div>
                    );
                })()}

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
                            <span className="font-bold text-base text-900">스톱워치가 일시정지되었습니다!</span>
                            <p className="text-xs text-600 m-0 line-height-3">
                                타이머 작동 중에는 휴대폰 화면이 꺼지지 않도록 유지됩니다.
                                <br />
                                다른 앱으로 전환하거나 전원 버튼을 눌러 화면을 끄면
                                <br />
                                순수 공부시간 측정이 자동으로 일시정지됩니다.
                                <br />
                                공부를 계속하려면 아래 버튼을 눌러주세요.
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
