'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { TabView, TabPanel } from 'primereact/tabview';
import { Tooltip } from 'primereact/tooltip';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { marked } from 'marked';
import dayjs from 'dayjs';
import styles from '@/styles/modules/DailyLogReport.module.css';

interface DailyReportAttendanceSummary {
    period: string;
    totalClasses: number;
    totalTrackedStudents: number;
    overallAttendanceRate: number;
    overallLateRate: number;
    overallAbsentRate: number;
    totalPresent: number;
    totalLate: number;
    totalAbsent: number;
    totalLateMinutes: number;
}

interface DailyReportHomeworkSummary {
    overallHomeworkRate: number;
    totalHomeworkRecords: number;
    excellentStudentsCount: number;
    warningStudentsCount: number;
    todoTotal: number;
    todoCompleted: number;
    todoPending: number;
}

interface DailyReportScoreSummary {
    year: number;
    totalActiveStudents: number;
    registeredScoresCount: number;
    registrationRate: number;
    averageMathScore: number | null;
    highestMath?: { name: string; score: number; school?: string; grade?: string; term?: string } | null;
    lowestMath?: { name: string; score: number; school?: string; grade?: string; term?: string } | null;
}

interface DailyReportStudyTimeSummary {
    activeCount: number;
    totalSeconds: number;
    totalFormatted: string;
    topStudent?: { name: string; totalSeconds: number; formattedTime: string } | null;
}

interface DailyReportSummary {
    totalLogs: number;
    activeUsersCount: number;
    uniqueIpsCount: number;
    activeUserNames: string[];
    errorCount: number;
    topEndpointsCount?: Array<{ path: string; method: string; count: number }>;
    attendance?: DailyReportAttendanceSummary | null;
    homework?: DailyReportHomeworkSummary | null;
    score?: DailyReportScoreSummary | null;
    studyTime?: DailyReportStudyTimeSummary | null;
}

interface DailyReportItem {
    _id?: string;
    date: string;
    title: string;
    summary: DailyReportSummary | null;
    createdAt?: string;
    updatedAt?: string;
}

interface DailyReportDetail extends DailyReportItem {
    markdownContent: string;
    studentMarkdownContent?: string;
    logMarkdownContent?: string;
    source?: string;
}

/**
 * 기존 DB 도큐먼트에 분리된 마크다운 필드가 없을 때를 위한 fallback 파싱 함수
 */
const splitMarkdownFallback = (fullMd: string, dateStr: string) => {
    if (!fullMd) return { fallbackStudentMd: '', fallbackLogMd: '' };

    const studentMatch = fullMd.match(/##\s+(?:📅\s*)?1\.\s*출석/i);
    const logMatch = fullMd.match(/##\s+(?:👥\s*)?5\.\s*시스템\s*로그/i);

    const studentIdx = studentMatch?.index ?? -1;
    const logIdx = logMatch?.index ?? -1;

    let studentBody = '';
    let logBody = '';

    if (studentIdx !== -1 && logIdx !== -1 && logIdx > studentIdx) {
        studentBody = fullMd.slice(studentIdx, logIdx).trim();
        logBody = fullMd.slice(logIdx).trim();
    } else if (logIdx !== -1) {
        studentBody = fullMd.slice(0, logIdx).trim();
        logBody = fullMd.slice(logIdx).trim();
    } else {
        studentBody = fullMd;
        logBody = fullMd;
    }

    const fallbackStudentMd =
        `# 🎓 일일 학생 종합 분석 보고서 (${dateStr})\n\n` +
        `> **ChoiMath 학사 종합 분석 리포트**  \n` +
        `> **기준 일자**: ${dateStr} | **분석 범위**: 당월 출석/과제, 학년도 성적, 순공 시간\n\n` +
        studentBody;

    const fallbackLogMd =
        `# 🖥️ 일일 시스템 로그 종합 분석 보고서 (${dateStr})\n\n` +
        `> **ChoiMath 시스템 운영·API 종합 리포트**  \n` +
        `> **기준 일자**: ${dateStr} | **분석 범위**: 일일 시스템 로그, 사용자 접속 활동, 엔드포인트 호출, 에러 추적\n\n` +
        logBody;

    return { fallbackStudentMd, fallbackLogMd };
};

const DailyLogReportPage = () => {
    const http = useHttp();
    const httpRef = useRef(http);
    useEffect(() => {
        httpRef.current = http;
    }, [http]);

    const { showToast } = useToast();

    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [reportList, setReportList] = useState<DailyReportItem[]>([]);
    const [currentReport, setCurrentReport] = useState<DailyReportDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
    const [generating, setGenerating] = useState<boolean>(false);
    const [activeTabIndex, setActiveTabIndex] = useState<number>(0);

    // 날짜 문자열 포맷팅
    const selectedDateStr = useMemo(() => {
        return dayjs(selectedDate).format('YYYY-MM-DD');
    }, [selectedDate]);

    // 1. 최근 일일 보고서 목록 조회
    const fetchReportList = useCallback(async () => {
        try {
            const res = await httpRef.current.get('/system/dailyReports', {
                params: { limit: 30 },
                disableLoading: true
            });
            const reports: DailyReportItem[] = res.data?.reports || [];
            setReportList(reports);

            // 목록 중 가장 최근 보고서가 있고 선택된 날짜에 보고서가 없으면 최신 보고서 날짜로 맞춤
            if (reports.length > 0) {
                const dates = reports.map((r) => r.date);
                const currentStr = dayjs(selectedDate).format('YYYY-MM-DD');
                if (!dates.includes(currentStr)) {
                    setSelectedDate(dayjs(reports[0].date).toDate());
                }
            }
        } catch (err) {
            console.error('Failed to fetch daily reports list:', err);
        }
    }, [selectedDate]);

    // 2. 특정 날짜의 상세 보고서 조회
    const fetchReportDetail = useCallback(async (targetDateStr: string) => {
        setLoadingDetail(true);
        try {
            const res = await httpRef.current.get(`/system/dailyReports/${targetDateStr}`, {
                disableLoading: true
            });
            setCurrentReport(res.data || null);
        } catch (err: any) {
            if (err?.response?.status === 404 || err === 'Not Found') {
                setCurrentReport(null);
            } else {
                console.error('Failed to fetch daily report detail:', err);
                setCurrentReport(null);
            }
        } finally {
            setLoadingDetail(false);
        }
    }, []);

    // 초기 마운트 시 목록 로드
    useEffect(() => {
        fetchReportList();
    }, [fetchReportList]);

    // 선택된 날짜 변경 시 해당 보고서 상세 로드
    useEffect(() => {
        if (selectedDateStr) {
            fetchReportDetail(selectedDateStr);
        }
    }, [selectedDateStr, fetchReportDetail]);

    // 3. 오늘 보고서 수동 생성/갱신 트리거
    const handleGenerateToday = async () => {
        setGenerating(true);
        try {
            const targetMonth = dayjs(selectedDate).format('YYYY-MM');
            const targetDate = dayjs(selectedDate).format('YYYY-MM-DD');
            const res = await httpRef.current.post(
                '/system/dailyReports/generate',
                { month: targetMonth, date: targetDate },
                { disableLoading: true }
            );
            if (res.data?.success) {
                const count = res.data.result?.count || 1;
                showToast({
                    severity: 'success',
                    summary: '보고서 분석 완료',
                    detail: `${targetMonth}월 리포트 (${count}건)가 성공적으로 생성 및 갱신되었습니다.`
                });
                await fetchReportList();
                await fetchReportDetail(targetDate);
            }
        } catch (err) {
            console.error('Failed to trigger daily analysis:', err);
            showToast({
                severity: 'error',
                summary: '생성 실패',
                detail: '일일 보고서 분석 실행 중 오류가 발생했습니다.'
            });
        } finally {
            setGenerating(false);
        }
    };

    // 마크다운 복사 핸들러
    const handleCopyMarkdown = (content: string, reportName: string) => {
        if (!content) return;
        navigator.clipboard.writeText(content);
        showToast({
            severity: 'info',
            summary: '복사 완료',
            detail: `${reportName} 마크다운이 클립보드에 복사되었습니다.`
        });
    };

    // 마크다운 원본 추출
    const fullMarkdown = useMemo(() => currentReport?.markdownContent || '', [currentReport?.markdownContent]);

    const { fallbackStudentMd, fallbackLogMd } = useMemo(() => {
        if (!currentReport?.markdownContent) return { fallbackStudentMd: '', fallbackLogMd: '' };
        return splitMarkdownFallback(currentReport.markdownContent, selectedDateStr);
    }, [currentReport?.markdownContent, selectedDateStr]);

    const studentMarkdown = useMemo(() => {
        return currentReport?.studentMarkdownContent || fallbackStudentMd;
    }, [currentReport?.studentMarkdownContent, fallbackStudentMd]);

    const logMarkdown = useMemo(() => {
        return currentReport?.logMarkdownContent || fallbackLogMd;
    }, [currentReport?.logMarkdownContent, fallbackLogMd]);

    // 마크다운 HTML 파싱 (3개 탭 각각)
    const renderedFullHtml = useMemo(() => {
        if (!fullMarkdown) return '';
        try {
            return marked.parse(fullMarkdown) as string;
        } catch (e) {
            console.error('Markdown parse error (Full):', e);
            return fullMarkdown;
        }
    }, [fullMarkdown]);

    const renderedStudentHtml = useMemo(() => {
        if (!studentMarkdown) return '';
        try {
            return marked.parse(studentMarkdown) as string;
        } catch (e) {
            console.error('Markdown parse error (Student):', e);
            return studentMarkdown;
        }
    }, [studentMarkdown]);

    const renderedLogHtml = useMemo(() => {
        if (!logMarkdown) return '';
        try {
            return marked.parse(logMarkdown) as string;
        } catch (e) {
            console.error('Markdown parse error (Log):', e);
            return logMarkdown;
        }
    }, [logMarkdown]);

    // 현재 활성화된 탭의 마크다운과 타이틀
    const currentActiveTab = useMemo(() => {
        if (activeTabIndex === 1) {
            return { title: '학생 종합 분석 리포트', markdown: studentMarkdown };
        }
        if (activeTabIndex === 2) {
            return { title: '로그 종합 분석 리포트', markdown: logMarkdown };
        }
        return { title: '종합 분석 리포트', markdown: fullMarkdown };
    }, [activeTabIndex, studentMarkdown, logMarkdown, fullMarkdown]);

    const summary = currentReport?.summary;

    return (
        <div className={`flex flex-column gap-3 ${styles.reportContainer}`}>
            <Tooltip target=".report-tooltip" position="top" />

            {/* 상단 메인 헤더 & 컨트롤 바 */}
            <Card className="shadow-2 border-round-xl">
                <div className="flex flex-column md:flex-row align-items-start md:align-items-center justify-content-between gap-3">
                    <div className="flex align-items-center gap-3">
                        <div
                            className="flex align-items-center justify-content-center border-round-xl surface-100"
                            style={{ width: '48px', height: '48px' }}
                        >
                            <i className="pi pi-file-edit text-2xl text-primary" />
                        </div>
                        <div>
                            <div className="flex align-items-center gap-2">
                                <h1 className="m-0 text-xl font-bold text-900">일일 통합 분석 보고서</h1>
                            </div>
                            <span className="text-xs text-500">
                                성적·출석·과제수행 분석 및 일일 시스템 로그 종합 리포트
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap align-items-center gap-2 w-full md:w-auto">
                        {/* 날짜 선택 달력 */}
                        <div className="flex align-items-center gap-2">
                            <Calendar
                                value={selectedDate}
                                onChange={(e) => {
                                    if (e.value instanceof Date) {
                                        setSelectedDate(e.value);
                                    }
                                }}
                                dateFormat="yy-mm-dd"
                                showIcon
                                maxDate={new Date()}
                                className="p-inputtext-sm w-11rem md:w-12rem"
                                placeholder="날짜 선택"
                            />
                        </div>

                        {/* 지금 분석 실행 버튼 */}
                        <Button
                            icon="pi pi-refresh"
                            label="지금 분석 실행"
                            size="small"
                            severity="success"
                            loading={generating}
                            onClick={handleGenerateToday}
                            tooltip="선택한 월에서 아직 생성되지 않은 모든 일일 리포트를 분석하여 MongoDB에 저장합니다."
                            tooltipOptions={{ position: 'top' }}
                            className="p-button-sm font-bold"
                        />
                    </div>
                </div>

                {/* 최근 보고서 빠른 이동 칩 바 */}
                {reportList.length > 0 && (
                    <div className="flex align-items-center gap-2 pt-3 mt-3 border-top-1 surface-border overflow-x-auto">
                        <span className="text-xs text-600 font-bold white-space-nowrap flex align-items-center gap-1">
                            <i className="pi pi-history text-xs" /> 최근 보고서:
                        </span>
                        <div className="flex align-items-center gap-1">
                            {reportList.map((item) => {
                                const isSelected = item.date === selectedDateStr;
                                return (
                                    <Button
                                        key={item.date}
                                        label={item.date}
                                        size="small"
                                        text={!isSelected}
                                        severity={isSelected ? undefined : 'secondary'}
                                        className={`p-1 px-2 text-xs font-semibold border-round-2xl ${
                                            isSelected ? 'shadow-1' : ''
                                        }`}
                                        onClick={() => setSelectedDate(dayjs(item.date).toDate())}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </Card>

            {/* 주요 핵심 5대 도메인 KPI 요약 카드 */}
            {summary && (
                <div className="grid">
                    {/* 1. 출석 현황 KPI */}
                    <div className="col-12 sm:col-6 lg:col">
                        <Card className={`shadow-1 border-round-xl surface-card ${styles.kpiCard}`}>
                            <div className="flex justify-content-between align-items-center mb-2">
                                <span className="text-xs font-bold text-600">당월 출석률</span>
                                <div
                                    className="flex align-items-center justify-content-center border-round-lg surface-100"
                                    style={{ width: '32px', height: '32px' }}
                                >
                                    <i className="pi pi-check-circle text-green-600 text-sm" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-900">
                                {summary.attendance ? `${summary.attendance.overallAttendanceRate}%` : '-'}
                            </div>
                            <span className="text-xs text-500">
                                {summary.attendance
                                    ? `출석 ${summary.attendance.totalPresent} · 지각 ${summary.attendance.totalLate} · 결석 ${summary.attendance.totalAbsent}`
                                    : '출석 집계 대기'}
                            </span>
                        </Card>
                    </div>

                    {/* 2. 과제 수행 KPI */}
                    <div className="col-12 sm:col-6 lg:col">
                        <Card className={`shadow-1 border-round-xl surface-card ${styles.kpiCard}`}>
                            <div className="flex justify-content-between align-items-center mb-2">
                                <span className="text-xs font-bold text-600">평균 과제 수행률</span>
                                <div
                                    className="flex align-items-center justify-content-center border-round-lg surface-100"
                                    style={{ width: '32px', height: '32px' }}
                                >
                                    <i className="pi pi-book text-indigo-600 text-sm" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-900">
                                {summary.homework ? `${summary.homework.overallHomeworkRate}%` : '-'}
                            </div>
                            <span className="text-xs text-500">
                                {summary.homework
                                    ? `우수 ${summary.homework.excellentStudentsCount}명 · 관리요망 ${summary.homework.warningStudentsCount}명`
                                    : '과제 데이터 대기'}
                            </span>
                        </Card>
                    </div>

                    {/* 3. 성적 관리 KPI */}
                    <div className="col-12 sm:col-6 lg:col">
                        <Card className={`shadow-1 border-round-xl surface-card ${styles.kpiCard}`}>
                            <div className="flex justify-content-between align-items-center mb-2">
                                <span className="text-xs font-bold text-600">성적부 등록률</span>
                                <div
                                    className="flex align-items-center justify-content-center border-round-lg surface-100"
                                    style={{ width: '32px', height: '32px' }}
                                >
                                    <i className="pi pi-chart-line text-orange-500 text-sm" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-900">
                                {summary.score ? `${summary.score.registrationRate}%` : '-'}
                            </div>
                            <span className="text-xs text-500">
                                {summary.score
                                    ? `재원생 ${summary.score.totalActiveStudents}명 중 ${summary.score.registeredScoresCount}명 등록`
                                    : '성적 데이터 대기'}
                            </span>
                        </Card>
                    </div>

                    {/* 4. 순공 시간 KPI */}
                    <div className="col-12 sm:col-6 lg:col">
                        <Card className={`shadow-1 border-round-xl surface-card ${styles.kpiCard}`}>
                            <div className="flex justify-content-between align-items-center mb-2">
                                <span className="text-xs font-bold text-600">오늘 총 순공 시간</span>
                                <div
                                    className="flex align-items-center justify-content-center border-round-lg surface-100"
                                    style={{ width: '32px', height: '32px' }}
                                >
                                    <i className="pi pi-clock text-purple-600 text-sm" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-900">
                                {summary.studyTime ? summary.studyTime.totalFormatted : '0시간 0분'}
                            </div>
                            <span className="text-xs text-500">
                                {summary.studyTime?.topStudent
                                    ? `1위: ${summary.studyTime.topStudent.name} (${summary.studyTime.topStudent.formattedTime})`
                                    : '당일 순공 참여자 0명'}
                            </span>
                        </Card>
                    </div>

                    {/* 5. 시스템 로그 & 활동 KPI */}
                    <div className="col-12 sm:col-6 lg:col">
                        <Card className={`shadow-1 border-round-xl surface-card ${styles.kpiCard}`}>
                            <div className="flex justify-content-between align-items-center mb-2">
                                <span className="text-xs font-bold text-600">시스템 API 로그</span>
                                <div
                                    className="flex align-items-center justify-content-center border-round-lg surface-100"
                                    style={{ width: '32px', height: '32px' }}
                                >
                                    <i className="pi pi-server text-blue-600 text-sm" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-900">
                                {summary.totalLogs.toLocaleString()}
                                <span className="text-sm font-normal text-500 ml-1">건</span>
                            </div>
                            <span className="text-xs text-500">
                                활성 사용자 {summary.activeUsersCount}명 · 에러 {summary.errorCount}건
                            </span>
                        </Card>
                    </div>
                </div>
            )}

            {/* 본문 보고서 뷰어 카드 */}
            <Card className="shadow-2 border-round-xl">
                {loadingDetail ? (
                    <div className="flex flex-column align-items-center justify-content-center py-8 text-center text-500">
                        <i className="pi pi-spin pi-spinner text-3xl mb-3 text-primary" />
                        <span className="font-semibold text-sm">{selectedDateStr} 보고서를 불러오는 중입니다...</span>
                    </div>
                ) : currentReport ? (
                    <div>
                        {/* 보고서 상단 타이틀 및 복사 아이콘 바 */}
                        <div className="flex flex-wrap justify-content-between align-items-center gap-2 mb-3 pb-3 border-bottom-1 surface-border">
                            <div className="flex align-items-center gap-2">
                                <i className="pi pi-file text-xl text-primary" />
                                <span className="text-base md:text-lg font-bold text-900">
                                    {selectedDateStr} {currentActiveTab.title}
                                </span>
                                {/* 보고서 옆 카피 아이콘 버튼 */}
                                <button
                                    type="button"
                                    className={styles.copyIconButton}
                                    title={`${currentActiveTab.title} 마크다운 복사`}
                                    onClick={() => handleCopyMarkdown(currentActiveTab.markdown, currentActiveTab.title)}
                                >
                                    <i className="pi pi-copy text-base text-700 hover:text-primary" />
                                </button>
                            </div>
                            <div className="flex align-items-center gap-2">
                                <Button
                                    icon="pi pi-copy"
                                    label="현재 탭 마크다운 복사"
                                    size="small"
                                    text
                                    severity="secondary"
                                    className="p-button-sm text-xs font-semibold"
                                    onClick={() => handleCopyMarkdown(currentActiveTab.markdown, currentActiveTab.title)}
                                />
                            </div>
                        </div>

                        {/* 3개 탭: 종합 분석 리포트 / 학생 종합 분석 리포트 / 로그 종합 분석 리포트 */}
                        <TabView
                            activeIndex={activeTabIndex}
                            onTabChange={(e) => setActiveTabIndex(e.index)}
                        >
                            {/* 탭 1: 종합 분석 리포트 */}
                            <TabPanel
                                header={
                                    <div className="flex align-items-center gap-2">
                                        <i className="pi pi-desktop text-primary font-bold" />
                                        <span className="font-bold">종합 분석 리포트</span>
                                        <button
                                            type="button"
                                            className={styles.copyIconButton}
                                            title="종합 분석 리포트 마크다운 복사"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopyMarkdown(fullMarkdown, '종합 분석 리포트');
                                            }}
                                        >
                                            <i className="pi pi-copy text-sm" />
                                        </button>
                                    </div>
                                }
                            >
                                <div
                                    className={`pt-2 ${styles.markdownBody}`}
                                    dangerouslySetInnerHTML={{ __html: renderedFullHtml }}
                                />
                            </TabPanel>

                            {/* 탭 2: 학생 종합 분석 리포트 (학생 성적, 출석 리포트) */}
                            <TabPanel
                                header={
                                    <div className="flex align-items-center gap-2">
                                        <i className="pi pi-users text-green-600 font-bold" />
                                        <span className="font-bold">학생 종합 분석 리포트</span>
                                        <button
                                            type="button"
                                            className={styles.copyIconButton}
                                            title="학생 종합 분석 리포트 마크다운 복사"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopyMarkdown(studentMarkdown, '학생 종합 분석 리포트');
                                            }}
                                        >
                                            <i className="pi pi-copy text-sm" />
                                        </button>
                                    </div>
                                }
                            >
                                <div
                                    className={`pt-2 ${styles.markdownBody}`}
                                    dangerouslySetInnerHTML={{ __html: renderedStudentHtml }}
                                />
                            </TabPanel>

                            {/* 탭 3: 로그 종합 분석 리포트 (API 관련 분석자료) */}
                            <TabPanel
                                header={
                                    <div className="flex align-items-center gap-2">
                                        <i className="pi pi-server text-blue-600 font-bold" />
                                        <span className="font-bold">로그 종합 분석 리포트</span>
                                        <button
                                            type="button"
                                            className={styles.copyIconButton}
                                            title="로그 종합 분석 리포트 마크다운 복사"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopyMarkdown(logMarkdown, '로그 종합 분석 리포트');
                                            }}
                                        >
                                            <i className="pi pi-copy text-sm" />
                                        </button>
                                    </div>
                                }
                            >
                                <div
                                    className={`pt-2 ${styles.markdownBody}`}
                                    dangerouslySetInnerHTML={{ __html: renderedLogHtml }}
                                />
                            </TabPanel>
                        </TabView>
                    </div>
                ) : (
                    <div className="flex flex-column align-items-center justify-content-center py-8 text-center text-500">
                        <i className="pi pi-info-circle text-4xl mb-3 text-400" />
                        <strong className="text-lg text-700 mb-1">
                            {selectedDateStr} 일자의 분석 보고서가 없습니다.
                        </strong>
                        <p className="text-sm text-500 m-0 mb-3">
                            상단의 <strong>[지금 분석 실행]</strong> 버튼을 누르면 성적, 출석, 과제, 순공 및 로그 데이터를
                            통합 분석하여 보고서가 생성됩니다.
                        </p>
                        <Button
                            icon="pi pi-play"
                            label="지금 분석 리포트 생성"
                            severity="success"
                            loading={generating}
                            onClick={handleGenerateToday}
                        />
                    </div>
                )}
            </Card>
        </div>
    );
};

export default DailyLogReportPage;
