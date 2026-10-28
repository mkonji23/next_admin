'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Tag } from 'primereact/tag';
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
    source?: string;
}

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
            const res = await httpRef.current.post('/system/dailyReports/generate', {}, { disableLoading: true });
            if (res.data?.success) {
                showToast({
                    severity: 'success',
                    summary: '보고서 생성 완료',
                    detail: '출석·과제·성적·로그 일일 통합 분석 보고서가 성공적으로 생성 및 저장되었습니다.'
                });
                const today = new Date();
                setSelectedDate(today);
                await fetchReportList();
                await fetchReportDetail(dayjs(today).format('YYYY-MM-DD'));
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

    // 마크다운 전문 복사
    const handleCopyMarkdown = () => {
        if (!currentReport?.markdownContent) return;
        navigator.clipboard.writeText(currentReport.markdownContent);
        showToast({
            severity: 'info',
            summary: '복사 완료',
            detail: '마크다운 리포트 내용이 클립보드에 복사되었습니다.'
        });
    };

    // 마크다운 HTML 파싱
    const renderedHtml = useMemo(() => {
        if (!currentReport?.markdownContent) return '';
        try {
            return marked.parse(currentReport.markdownContent) as string;
        } catch (e) {
            console.error('Markdown parse error:', e);
            return currentReport.markdownContent;
        }
    }, [currentReport?.markdownContent]);

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
                                {currentReport && <Tag severity="success" value="MongoDB 저장 완료" className="text-xs" />}
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

                        {/* 복사 버튼 */}
                        <Button
                            icon="pi pi-copy"
                            label="마크다운 복사"
                            size="small"
                            outlined
                            disabled={!currentReport}
                            onClick={handleCopyMarkdown}
                            className="p-button-sm font-semibold"
                        />

                        {/* 지금 분석 실행 버튼 */}
                        <Button
                            icon="pi pi-refresh"
                            label="지금 분석 실행"
                            size="small"
                            severity="success"
                            loading={generating}
                            onClick={handleGenerateToday}
                            tooltip="성적, 출석, 과제, 순공 및 로그 데이터를 즉시 재분석하여 MongoDB에 저장합니다."
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
                    <TabView>
                        {/* 탭 1: 서식 적용된 마크다운 뷰어 */}
                        <TabPanel
                            header={
                                <div className="flex align-items-center gap-2">
                                    <i className="pi pi-desktop text-primary" />
                                    <span className="font-bold">종합 분석 리포트 전문</span>
                                </div>
                            }
                        >
                            <div
                                className={`pt-2 ${styles.markdownBody}`}
                                dangerouslySetInnerHTML={{ __html: renderedHtml }}
                            />
                        </TabPanel>

                        {/* 탭 2: 원본 마크다운 뷰어 */}
                        <TabPanel
                            header={
                                <div className="flex align-items-center gap-2">
                                    <i className="pi pi-code text-indigo-500" />
                                    <span className="font-bold">원본 마크다운 (Raw)</span>
                                </div>
                            }
                        >
                            <div className="flex justify-content-between align-items-center mb-2 pt-2">
                                <span className="text-xs text-600 font-semibold">마크다운 전문 코드:</span>
                                <Button
                                    icon="pi pi-copy"
                                    label="복사"
                                    size="small"
                                    text
                                    onClick={handleCopyMarkdown}
                                    className="p-button-sm"
                                />
                            </div>
                            <pre
                                className="m-0 p-3 border-round surface-900 text-gray-100 font-mono text-xs overflow-auto select-all"
                                style={{ maxHeight: '650px', lineHeight: '1.5' }}
                            >
                                {currentReport.markdownContent}
                            </pre>
                        </TabPanel>
                    </TabView>
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
