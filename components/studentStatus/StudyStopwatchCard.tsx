'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { useStudyStopwatch } from '@/hooks/useStudyStopwatch';
import { StudyEndReason } from '@/types/studyTime';
import dayjs from 'dayjs';

interface StudyStopwatchCardProps {
    studentId?: string;
    studentName?: string;
}

const StudyStopwatchCard: React.FC<StudyStopwatchCardProps> = ({ studentId, studentName }) => {
    const [currentTime, setCurrentTime] = useState<dayjs.Dayjs>(dayjs());
    const [alertVisible, setAlertVisible] = useState<boolean>(false);
    const [alertReason, setAlertReason] = useState<StudyEndReason | null>(null);
    const [timelineVisible, setTimelineVisible] = useState<boolean>(false);

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
    const totalTimeDisplay = formatTime(activeTotalSeconds);
    const sessionTimeDisplay = formatTime(currentSessionSeconds);

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

    // 초를 "총 X시간 Y분 Z초" 한글 텍스트로 변환하는 헬퍼
    const formatDurationKorean = (totalSeconds: number) => {
        if (!totalSeconds || totalSeconds <= 0) return '총 0초';
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;

        const parts: string[] = [];
        if (h > 0) parts.push(`${h}시간`);
        if (m > 0) parts.push(`${m}분`);
        if (s > 0 || parts.length === 0) parts.push(`${s}초`);

        return `총 ${parts.join(' ')}`;
    };

    return (
        <Card className="mb-4 shadow-2 border-round-2xl surface-card overflow-hidden">
            <div className="flex flex-column gap-3">
                {/* 상단 헤더: 타이틀, 현재시간 & 상태 태그 */}
                <div className="flex align-items-center justify-content-between border-bottom-1 surface-border pb-2">
                    <div className="flex flex-column gap-1">
                        <div className="flex align-items-center gap-2">
                            <i className="pi pi-stopwatch text-primary text-xl" />
                            <span className="font-bold text-lg text-900">오늘의 순공시간</span>
                        </div>
                        {/* 현재 시간 표시 (오전/오후 분까지만 표시) */}
                        <div className="flex align-items-center gap-1 text-xs text-600">
                            <i className="pi pi-clock text-xs text-primary" />
                            <span>
                                현재 시간:{' '}
                                <strong className="text-800 font-semibold">
                                    {formatKoreanTime(currentTime, false)}
                                </strong>
                            </span>
                        </div>
                    </div>

                    <div className="flex align-items-center gap-2">
                        {isRunning ? (
                            <Tag
                                severity="danger"
                                value="집중"
                                className="font-bold animate-pulse px-2 py-1"
                                style={{ fontSize: '11px' }}
                            />
                        ) : (
                            <Tag
                                severity={null}
                                value="일시정지"
                                className="font-medium px-2 py-1 surface-200 text-700"
                                style={{ fontSize: '11px' }}
                            />
                        )}
                        <Button
                            icon="pi pi-list"
                            size="small"
                            text
                            rounded
                            severity="secondary"
                            tooltipOptions={{ position: 'top' }}
                            onClick={() => setTimelineVisible(true)}
                        />
                    </div>
                </div>

                {/* 중앙: 대형 스톱워치 디스플레이 (하나만 깔끔하게 표시) */}
                <div className="flex flex-column align-items-center justify-content-center py-2">
                    <div
                        className="text-4xl md:text-5xl font-extrabold tracking-wider text-900 font-mono mb-1"
                        style={{ letterSpacing: '2px' }}
                    >
                        {totalTimeDisplay.formatted}
                    </div>
                </div>

                {/* 하단 컨트롤 버튼 */}
                <div className="flex justify-content-center gap-3">
                    {!isRunning ? (
                        <Button
                            label="공부 시작"
                            icon="pi pi-play"
                            severity="success"
                            className="w-full max-w-15rem font-bold py-2 shadow-1"
                            onClick={startStudy}
                            disabled={loading || !studentId}
                        />
                    ) : (
                        <Button
                            label="일시정지"
                            icon="pi pi-pause"
                            severity="warning"
                            className="w-full max-w-15rem font-bold py-2 shadow-1"
                            onClick={() => pauseStudy('manual_pause')}
                        />
                    )}
                </div>

                {/* 하단 통계 정보 (최초 시작, 최종 종료, 세션 수) */}
                <div className="grid grid-nogutter surface-100 border-round-xl p-2 mt-1 text-center text-xs">
                    <div className="col-4 border-right-1 surface-border">
                        <span className="text-500 block mb-1">첫 시작</span>
                        <strong className="text-700 font-semibold text-xs md:text-sm">
                            {formatKoreanTime(todayData?.firstStartedAt)}
                        </strong>
                    </div>
                    <div className="col-4 border-right-1 surface-border">
                        <span className="text-500 block mb-1">마지막 종료</span>
                        <strong className="text-700 font-semibold text-xs md:text-sm">
                            {formatKoreanTime(todayData?.lastEndedAt)}
                        </strong>
                    </div>
                    <div className="col-4">
                        <span className="text-500 block mb-1">집중 세션</span>
                        <strong className="text-primary font-semibold text-xs md:text-sm">
                            {todayData?.sessionsCount || 0}회
                        </strong>
                    </div>
                </div>
            </div>

            <Dialog
                visible={alertVisible}
                onHide={() => setAlertVisible(false)}
                header="화면 이탈 감지"
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
                            startStudy();
                        }}
                    />
                }
            >
                <div className="flex flex-column align-items-center text-center gap-2 py-2">
                    <i className="pi pi-exclamation-triangle text-yellow-500 text-4xl mb-1" />
                    <span className="font-bold text-base text-900">스톱워치가 자동으로 멈췄습니다!</span>
                    <p className="text-xs text-600 m-0 line-height-3">
                        모바일 화면을 끄거나 다른 앱으로 전환하면
                        <br />
                        순수 공부시간 측정이 자동으로 중단됩니다.
                        <br />
                        공부를 다시 시작하려면 아래 버튼을 눌러주세요.
                    </p>
                </div>
            </Dialog>

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
                    <span className="text-primary font-bold text-sm">{formatDurationKorean(activeTotalSeconds)}</span>
                </div>

                <div className="flex flex-column gap-2 pt-1 max-h-20rem overflow-y-auto">
                    {todayData?.sessions && todayData.sessions.length > 0 ? (
                        todayData.sessions.map((sess, idx) => {
                            const isPausedByLeave = sess.endReason === 'background_leave';
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
                                        </div>
                                    </div>

                                    {/* 오른쪽: 총 공부시간 한글 텍스트 */}
                                    <div className="text-right white-space-nowrap">
                                        <Tag
                                            value={formatDurationKorean(sess.durationSeconds)}
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
        </Card>
    );
};

export default StudyStopwatchCard;
