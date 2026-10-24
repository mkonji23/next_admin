'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useHttp } from '@/util/axiosInstance';
import { TodayStudyTimeData, StudyEndReason, StudySession } from '@/types/studyTime';
import dayjs from 'dayjs';

interface UseStudyStopwatchProps {
    studentId?: string;
    onBackgroundPaused?: (reason: StudyEndReason) => void;
}

export const useStudyStopwatch = ({ studentId, onBackgroundPaused }: UseStudyStopwatchProps) => {
    const http = useHttp();
    const [loading, setLoading] = useState<boolean>(true);
    const [todayData, setTodayData] = useState<TodayStudyTimeData | null>(null);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [todayTotalSeconds, setTodayTotalSeconds] = useState<number>(0);
    const [overallTotalSeconds, setOverallTotalSeconds] = useState<number>(0);
    const [currentSessionSeconds, setCurrentSessionSeconds] = useState<number>(0);

    const activeSessionIdRef = useRef<string | null>(null);
    const ticketRef = useRef<string | null>(null);
    const sessionStartTimeRef = useRef<number | null>(null);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isRunningRef = useRef<boolean>(false);
    const currentSessionSecondsRef = useRef<number>(0);
    const startPromiseRef = useRef<Promise<any> | null>(null);

    // 콜백 함수 ref 보관 (부모 컴포넌트 리렌더 시 불필요한 useEffect 재실행 및 무한루프 방지)
    const onBackgroundPausedRef = useRef(onBackgroundPaused);
    useEffect(() => {
        onBackgroundPausedRef.current = onBackgroundPaused;
    }, [onBackgroundPaused]);

    // ref 동기화
    useEffect(() => {
        isRunningRef.current = isRunning;
    }, [isRunning]);

    useEffect(() => {
        currentSessionSecondsRef.current = currentSessionSeconds;
    }, [currentSessionSeconds]);

    // 1. 오늘의 순공시간 데이터 조회 (불필요한 http 등 객체 의존성 제거하여 무한루프 방지)
    const fetchTodayData = useCallback(
        async (showLoading = true) => {
            if (!studentId) return;
            if (showLoading) setLoading(true);
            try {
                const todayStr = dayjs().format('YYYY-MM-DD');
                const res = await http.get('/choiMath/studyTime/getToday', {
                    params: { studentId, date: todayStr },
                    disableLoading: true,
                });

                const data: TodayStudyTimeData = res.data;
                setTodayData(data);
                setTodayTotalSeconds(data.totalSeconds || 0);
                setOverallTotalSeconds(data.overallTotalSeconds || 0);

                // 이전 접속 시 비정상 종료 등으로 활성 세션이 남아있다면 복원
                if (data.activeSession && !data.activeSession.endedAt) {
                    activeSessionIdRef.current = data.activeSession.sessionId;
                    ticketRef.current = data.activeSession.currentTicket || null;
                    const elapsedSinceStart = Math.floor(
                        (Date.now() - new Date(data.activeSession.startedAt).getTime()) / 1000
                    );
                    // 10시간 이상 지났다면 만료로 간주하고 정지 상태 유지
                    if (elapsedSinceStart > 0 && elapsedSinceStart < 36000) {
                        sessionStartTimeRef.current = Date.now() - (data.activeSession.durationSeconds || 0) * 1000;
                        setCurrentSessionSeconds(data.activeSession.durationSeconds || 0);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch today study time:', err);
            } finally {
                if (showLoading) setLoading(false);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [studentId]
    );

    // studentId가 준비되거나 변경될 때만 1회 실행 (fetchTodayData 의존성 제거로 무한 렌더링 방지)
    useEffect(() => {
        if (studentId) {
            fetchTodayData(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentId]);

    // 2. 타이머 틱(Tick) 핸들러 (정밀 시간 계산: Date.now() 차이 방식)
    const startTick = useCallback(() => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

        timerIntervalRef.current = setInterval(() => {
            if (sessionStartTimeRef.current) {
                const diffSec = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
                setCurrentSessionSeconds(diffSec);
            }
        }, 1000);
    }, []);

    const stopTick = useCallback(() => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
    }, []);

    // 컴포넌트 언마운트 시 인터벌 정리
    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        };
    }, []);

    // 3. 공부 시작 (낙관적 즉시 시작으로 반응속도 극대화)
    const startStudy = useCallback(async () => {
        if (!studentId || isRunningRef.current) return;

        // 1) UI 타이머를 즉시 시작 (지연 0ms)
        const nowMs = Date.now();
        sessionStartTimeRef.current = nowMs;
        setCurrentSessionSeconds(0);
        setIsRunning(true);
        isRunningRef.current = true;
        startTick();

        // 0ms 낙관적 첫 시작 시간 세팅 (비어있는 경우)
        setTodayData((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                firstStartedAt: prev.firstStartedAt || new Date(nowMs),
            };
        });

        try {
            const todayStr = dayjs().format('YYYY-MM-DD');
            const startPromise = http.post(
                '/choiMath/studyTime/start',
                { studentId, date: todayStr },
                { disableLoading: true }
            );
            startPromiseRef.current = startPromise;

            const res = await startPromise;

            if (res.data?.success) {
                activeSessionIdRef.current = res.data.sessionId;
                ticketRef.current = res.data.ticket || null;
            } else {
                // 서버 오류 시 롤백 (이미 사용자가 일시정지하지 않은 경우에만)
                if (isRunningRef.current) {
                    stopTick();
                    setIsRunning(false);
                    isRunningRef.current = false;
                    sessionStartTimeRef.current = null;
                }
            }
        } catch (err) {
            console.error('Error starting study session:', err);
            if (isRunningRef.current) {
                stopTick();
                setIsRunning(false);
                isRunningRef.current = false;
                sessionStartTimeRef.current = null;
            }
        } finally {
            startPromiseRef.current = null;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentId, startTick, stopTick]);

    // 4. 공부 일시정지 (화면 이탈 또는 수동 클릭) - 0ms 즉시 동기화 반영
    const pauseStudy = useCallback(
        async (reason: StudyEndReason = 'manual_pause') => {
            if (!isRunningRef.current && !activeSessionIdRef.current && !startPromiseRef.current) return;

            // 1) 즉시 타이머 정지 및 실제 경과 초 계산
            const startTime = sessionStartTimeRef.current;
            const elapsedSec = startTime
                ? Math.max(0, Math.floor((Date.now() - startTime) / 1000))
                : currentSessionSecondsRef.current;

            stopTick();
            setIsRunning(false);
            isRunningRef.current = false;
            sessionStartTimeRef.current = null;

            // 2) 0ms 즉각 UI 낙관적 반영 (대형 시계, 전체 총 공부시간, 세션 수, 마지막 종료 시각)
            setTodayTotalSeconds((prev) => prev + elapsedSec);
            setOverallTotalSeconds((prev) => (prev || 0) + elapsedSec);
            setCurrentSessionSeconds(0);
            currentSessionSecondsRef.current = 0;

            const now = new Date();
            setTodayData((prev) => {
                if (!prev) return prev;
                const newSession: StudySession = {
                    sessionId: activeSessionIdRef.current || `sess_${Date.now()}`,
                    startedAt: startTime ? new Date(startTime) : now,
                    endedAt: now,
                    durationSeconds: elapsedSec,
                    endReason: reason,
                };
                const existingSessions = prev.sessions ? [...prev.sessions] : [];
                return {
                    ...prev,
                    totalSeconds: prev.totalSeconds + elapsedSec,
                    overallTotalSeconds: (prev.overallTotalSeconds || 0) + elapsedSec,
                    firstStartedAt: prev.firstStartedAt || (startTime ? new Date(startTime) : now),
                    lastEndedAt: now,
                    sessionsCount: existingSessions.length + 1,
                    sessions: [...existingSessions, newSession],
                    activeSession: null,
                };
            });

            // 3) 만약 /start 요청이 아직 진행 중이라면 완료될 때까지 대기하여 세션 ID 확보
            if (startPromiseRef.current) {
                try {
                    await startPromiseRef.current;
                } catch (e) {
                    console.warn('Wait for start request error:', e);
                }
            }

            const sessionId = activeSessionIdRef.current;
            const currentTicket = ticketRef.current;
            const todayStr = dayjs().format('YYYY-MM-DD');

            activeSessionIdRef.current = null;
            ticketRef.current = null;

            // 4) 서버에 세션 정산 요청 및 권위(Authoritative) 동기화
            if (studentId && sessionId) {
                try {
                    const res = await http.post(
                        '/choiMath/studyTime/pause',
                        {
                            studentId,
                            date: todayStr,
                            sessionId,
                            ticket: currentTicket,
                            sessionSeconds: elapsedSec,
                            endReason: reason,
                        },
                        { disableLoading: true }
                    );

                    if (res.data?.success) {
                        setTodayTotalSeconds(res.data.totalSeconds);
                        if (res.data.overallTotalSeconds !== undefined) {
                            setOverallTotalSeconds(res.data.overallTotalSeconds);
                        }
                        // 백그라운드 무소음(Silent) 데이터 동기화
                        await fetchTodayData(false);
                    }
                } catch (err) {
                    console.error('Error pausing study session:', err);
                }
            }

            if (reason !== 'manual_pause' && onBackgroundPausedRef.current) {
                onBackgroundPausedRef.current(reason);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [studentId, stopTick, fetchTodayData]
    );

    // 이벤트 리스너용 최신 pauseStudy 참조 유지
    const pauseStudyRef = useRef(pauseStudy);
    useEffect(() => {
        pauseStudyRef.current = pauseStudy;
    }, [pauseStudy]);

    // 5. ⚡ [핵심] 모바일 백그라운드 진입 / 화면 잠금 / 창 이탈 감지
    // (의존성 배열을 []로 고정하고 내부에서 pauseStudyRef를 호출하여 이벤트 리스너 재등록에 의한 루프 방지)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                if (isRunningRef.current) {
                    pauseStudyRef.current('background_leave');
                }
            }
        };

        const handleWindowBlur = () => {
            if (isRunningRef.current) {
                pauseStudyRef.current('window_blur');
            }
        };

        const handlePageHide = () => {
            if (isRunningRef.current) {
                pauseStudyRef.current('page_closed');
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleWindowBlur);
        window.addEventListener('pagehide', handlePageHide);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleWindowBlur);
            window.removeEventListener('pagehide', handlePageHide);
        };
    }, []);

    // 6. 60초 주기 자동 Heartbeat 싱크 (비정상 브라우저 종료 대비)
    // isRunning 상태 전환 시에만 인터벌 등록/해제되며, 내부 값은 ref로 안전하게 참조
    useEffect(() => {
        if (!isRunning || !studentId) return;

        const heartbeatInterval = setInterval(() => {
            const sessionId = activeSessionIdRef.current;
            const currentTicket = ticketRef.current;
            const sessionSec = currentSessionSecondsRef.current;
            if (sessionId && sessionSec > 0) {
                const todayStr = dayjs().format('YYYY-MM-DD');
                http.post(
                    '/choiMath/studyTime/sync',
                    {
                        studentId,
                        date: todayStr,
                        sessionId,
                        ticket: currentTicket,
                        currentSessionSeconds: sessionSec,
                    },
                    { disableLoading: true }
                )
                    .then((res) => {
                        // 핑퐁 티켓 교체 (다음 60초 싱크용 새 티켓)
                        if (res.data?.nextTicket) {
                            ticketRef.current = res.data.nextTicket;
                        }
                    })
                    .catch((e) => console.warn('Heartbeat sync warning:', e));
            }
        }, 60000);

        return () => clearInterval(heartbeatInterval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRunning, studentId]);

    // 초를 시:분:초 포맷으로 변환하는 유틸리티
    const formatTime = useCallback((totalSec: number) => {
        const sec = Math.max(0, Math.floor(totalSec));
        const hours = Math.floor(sec / 3600);
        const minutes = Math.floor((sec % 3600) / 60);
        const seconds = sec % 60;
        return {
            hours: String(hours).padStart(2, '0'),
            minutes: String(minutes).padStart(2, '0'),
            seconds: String(seconds).padStart(2, '0'),
            formatted: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
        };
    }, []);

    return {
        loading,
        isRunning,
        todayTotalSeconds,
        overallTotalSeconds,
        currentSessionSeconds,
        todayData,
        startStudy,
        pauseStudy,
        refetch: fetchTodayData,
        formatTime,
    };
};
