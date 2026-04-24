'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useHttp } from '@/util/axiosInstance';
import withStudentAuth, { StudentAuthData } from '@/components/hoc/withStudentAuth';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import dayjs, { Dayjs } from 'dayjs';
import { ATTENDANCE_STATUS_OPTIONS } from '@/constants/attendance';
import { AI_STUDENT_COMMENTS } from '@/constants/aiComments';
import AchievementCard from './AchievementCard';
import WeeklyReportList from './WeeklyReportList';
import AIStudentComment from './AIStudentComment';
import StatsCardsRow from './StatsCardsRow';
import ChartsRow from './ChartsRow';
import DetailsTable from './DetailsTable';
import ProfileSelectionDialog from './ProfileSelectionDialog';
import SpecialStudentPopup from './SpecialStudentPopup';
import useStudentAuthStore from '@/store/useStudentAuthStore';
import { useRefreshStore } from '@/store/useRefreshStore';
import { useCustomModal } from '@/hooks/useCustomModal';
import { LayoutContext } from '@/layout/context/layoutcontext';
import { useContext } from 'react';
import { PrimeReactContext } from 'primereact/api';

interface StudentStatusContentProps {
    studentAuthData?: StudentAuthData;
}

const StudentStatusContent = ({ studentAuthData }: StudentStatusContentProps) => {
    const http = useHttp();
    const { clearStudentAuth } = useStudentAuthStore();
    const { layoutConfig, setLayoutConfig } = useContext(LayoutContext);
    const { changeTheme } = useContext(PrimeReactContext);
    const isDark = layoutConfig.colorScheme === 'dark';
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
    const [chartData, setChartData] = useState<any>({});
    const [expandedRows, setExpandedRows] = useState<any>({});
    const [globalRank, setGlobalRank] = useState<number>(0);
    const [classRanks, setClassRanks] = useState<Record<string, number>>({});
    const [studentInfo, setStudentInfo] = useState<{ school?: string; grade?: string }>({});
    const [aiAnalyzing, setAiAnalyzing] = useState(true);
    const [aiProgress, setAiProgress] = useState(0);
    const [praiseTopRankers, setPraiseTopRankers] = useState<any[]>([]);
    const [totalHomeworkAvg, setTotalHomeworkAvg] = useState<number>(0);
    const [profileImage, setProfileImage] = useState<string>(studentAuthData?.profile || '');
    const [showProfileDialog, setShowProfileDialog] = useState(false);
    const [showSpecialModal, setShowSpecialModal] = useState(false);
    const [winImage, setWinImage] = useState<string>('');
    const [showBadgePreview, setShowBadgePreview] = useState(false);
    const { openModal } = useCustomModal();
    const { noticeRefreshSignal } = useRefreshStore();
    const [notices, setNotices] = useState<any[]>([]);
    const [hasCheckedNotice, setHasCheckedNotice] = useState(false);

    // 최고 순위 계산 (1~3위)
    const highestRank = useMemo(() => {
        let best = 999;
        if (globalRank > 0 && globalRank <= 3) best = Math.min(best, globalRank);
        if (classRanks) {
            for (const rank of Object.values(classRanks)) {
                if (rank > 0 && rank <= 3) best = Math.min(best, rank);
            }
        }
        return best === 999 ? 0 : best;
    }, [globalRank, classRanks]);

    // 사용 가능한 프로필 아이콘 목록
    const profileIcons = useMemo(() => {
        const baseIcons = [
            { name: '아이콘 1', value: '/icons/profiles/profile1.JPG' },
            { name: '아이콘 2', value: '/icons/profiles/profile2.JPG' },
            { name: '아이콘 3', value: '/icons/profiles/profile3.JPG' },
            { name: '아이콘 4', value: '/icons/profiles/profile4.JPG' },
            { name: '아이콘 5', value: '/icons/profiles/profile5.JPG' },
            { name: '아이콘 6', value: '/icons/profiles/profile6.JPG' },
            { name: '아이콘 7', value: '/icons/profiles/profile7.JPG' },
            { name: '아이콘 8', value: '/icons/profiles/profile8.JPG' },
            { name: '아이콘 9', value: '/icons/profiles/profile9.JPG' },
            { name: '아이콘 10', value: '/icons/profiles/profile10.JPG' },
            { name: '아이콘 11', value: '/icons/profiles/profile11.JPG' },
            { name: '아이콘 12', value: '/icons/profiles/profile12.JPG' },
            { name: '아이콘 13', value: '/icons/profiles/profile13.JPG' },
            { name: '아이콘 14', value: '/icons/profiles/profile14.JPG' },
            { name: '아이콘 15', value: '/icons/profiles/profile15.JPG' },
            { name: '아이콘 16', value: '/icons/profiles/profile16.JPG' },
            { name: '아이콘 17', value: '/icons/profiles/profile17.JPG' }
        ];

        if (highestRank > 0) {
            if (highestRank <= 3) {
                baseIcons.push({ name: '스페셜(3위)', value: '/icons/profiles/profile_win.png' });
            }
            if (highestRank <= 2) {
                baseIcons.push({ name: '스페셜(2위)', value: '/icons/profiles/profile_win3.png' });
            }
            if (highestRank === 1) {
                baseIcons.push({ name: '스페셜(1위)', value: '/icons/profiles/profile_win2.png' });
            }
        }
        return baseIcons;
    }, [highestRank]);
    const finalStudentId = studentAuthData?.studentId;

    useEffect(() => {
        setProfileImage(studentAuthData?.profile || '/icons/profiles/profile16.JPG');
    }, [finalStudentId]);

    const handleProfileChange = (imgUrl: string) => {
        setProfileImage(imgUrl);
        http.post(
            '/choiMath/student/updateStudent',
            { studentId: finalStudentId, profile: imgUrl },
            { disableLoading: true }
        );
        setShowProfileDialog(false);
    };

    const finalName = studentAuthData?.name;
    const finalPhone = studentAuthData?.phoneNumber;
    const finalSchool = studentAuthData?.school;
    const finalGrade = studentAuthData?.grade;

    useEffect(() => {
        if (finalName === '서현준') {
            setShowSpecialModal(true);
        }
    }, [finalName]);

    useEffect(() => {
        if (finalStudentId) {
            fetchStudentStats();
        } else {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finalStudentId, currentDate]);

    useEffect(() => {
        if (stats) {
            setAiAnalyzing(true);
            setAiProgress(0);
            const totalTime = Math.floor(Math.random() * (7000 - 5000 + 1)) + 5000;
            const startTime = Date.now();

            const timer = setInterval(() => {
                const elapsed = Date.now() - startTime;
                let newProgress = Math.floor((elapsed / totalTime) * 100);

                if (newProgress >= 100) {
                    newProgress = 100;
                    clearInterval(timer);
                    setAiProgress(newProgress);
                    setTimeout(() => setAiAnalyzing(false), 400);
                } else {
                    setAiProgress(newProgress);
                }
            }, 100);

            return () => clearInterval(timer);
        }
    }, [stats]);

    const attendanceRate = useMemo(() => {
        if (!chartData.classesAttendance || chartData.classesAttendance.length === 0) return 0;

        const totalAtt =
            chartData.classesAttendance.find((h: any) => h.className === '총 출석현황') ||
            chartData.classesAttendance[0];

        if (totalAtt) {
            const [present, absent, late] = totalAtt.attData.datasets[0].data;
            const total = present + absent + late;
            return total > 0 ? Math.round((present / total) * 100) : 0;
        }
        return 0;
    }, [chartData]);

    const aiComment = useMemo(() => {
        if (!stats) return '학습 데이터를 분석 중입니다...';

        let hwAvg = 0;
        if (chartData.classesHomework && chartData.classesHomework.length > 0) {
            const totalHw =
                chartData.classesHomework.find((h: any) => h.className === '총 달성률') || chartData.classesHomework[0];
            hwAvg = totalHw?.avgScore || 0;
        }

        const rate = attendanceRate / 100;
        const praise = stats.totalPraiseCnt || 0;

        if (rate === 0 && hwAvg === 0 && praise === 0) {
            return '아직 분석할 학업 데이터가 충분하지 않습니다. 앞으로의 활약을 기대합니다! 🌱';
        }

        const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
        let comments: string[] = [];

        const { attendance, homework, praise: praiseComments } = AI_STUDENT_COMMENTS;

        if (rate >= 0.95) comments.push(getRandom(attendance.high));
        else if (rate >= 0.8) comments.push(getRandom(attendance.mid));
        else comments.push(getRandom(attendance.low));

        if (hwAvg >= 90) comments.push(getRandom(homework.high));
        else if (hwAvg >= 70) comments.push(getRandom(homework.mid));
        else comments.push(getRandom(homework.low));

        if (praise >= 10) comments.push(getRandom(praiseComments.high));
        else if (praise >= 3) comments.push(getRandom(praiseComments.mid));
        else comments.push(getRandom(praiseComments.low));

        return comments.join(' ');
    }, [stats, chartData, attendanceRate]);

    const fetchStudentStats = async () => {
        try {
            const params = {
                dateFrom: currentDate.startOf('month').format('YYYYMMDD'),
                dateTo: currentDate.endOf('month').format('YYYYMMDD')
            };

            const [praiseRes, studentRes] = await Promise.all([
                http.get('/choiMath/attendance/getPraiseStatistics', { params }),
                http.post('/choiMath/student/verifyStudent', {
                    name: finalName,
                    phoneNumber: finalPhone
                })
            ]);

            const allData = praiseRes.data || [];

            // 1. 점수가 1개 이상인 학생만 먼저 걸러냅니다.
            const activeData = allData.filter((item: any) => (item.totalPraiseCnt || 0) > 0);

            // 2. 점수 내림차순 정렬
            const sortedData = [...activeData].sort(
                (a: any, b: any) => (b.totalPraiseCnt || 0) - (a.totalPraiseCnt || 0)
            );

            // 3. 공동 순위 부여 (1, 2, 2, 4...)
            let currentRank = 0;
            let lastPraiseCnt = -1;

            const rankedData = sortedData.map((item: any, index: number) => {
                if (item.totalPraiseCnt !== lastPraiseCnt) {
                    currentRank = index + 1;
                }
                lastPraiseCnt = item.totalPraiseCnt;

                return { ...item, rank: currentRank };
            });

            // 4. 최종적으로 3등 이내인 학생들만 추출
            const topRankers = rankedData.filter((item) => item.rank <= 3);

            setPraiseTopRankers(topRankers);

            const resDetail = await http.get('/choiMath/attendance/getPraiseStatistics', {
                params: { ...params, studentId: finalStudentId },
                disableLoading: true
            });

            const myData = resDetail.data[0] || {};
            const matchedStudent = studentRes.data;
            if (matchedStudent) {
                setStudentInfo({ school: matchedStudent.school, grade: matchedStudent.grade });
            }

            if (myData) {
                setStats(myData);

                // --- 전체 순위 계산 (0점 제외) ---
                const myGlobalScore = myData.totalPraiseCnt || 0;
                let gRank = 0; // 0점은 순위 없음
                if (myGlobalScore > 0) {
                    const allGlobalCounts = allData
                        .map((s: any) => s.totalPraiseCnt || 0)
                        .filter((score: number) => score > 0) // 0점 제외
                        .sort((a: number, b: number) => b - a);
                    gRank = allGlobalCounts.indexOf(myGlobalScore) + 1;
                }
                setGlobalRank(gRank);

                // --- 클래스별 순위 계산 (0점 제외) ---
                let cRanks: Record<string, number> = {};
                if (myData.classes && myData.classes.length > 0) {
                    myData.classes.forEach((myClass: any) => {
                        const classId = myClass.classId;
                        const myClassScore = myClass.attendance?.filter((a: any) => a.praise).length || 0;

                        let classRank = 0; // 0점은 순위 없음
                        if (myClassScore > 0) {
                            const allClassCounts = allData
                                .map((s: any) => {
                                    const c = s.classes?.find((cls: any) => cls.classId === classId);
                                    return c?.attendance?.filter((a: any) => a.praise).length || 0;
                                })
                                .filter((score: number) => score > 0) // 0점 제외
                                .sort((a: number, b: number) => b - a);

                            classRank = allClassCounts.indexOf(myClassScore) + 1;
                        }
                        cRanks[classId] = classRank;
                    });
                }
                setClassRanks(cRanks);

                prepareChartData(myData);

                // Fetch notices for student's classes
                if (myData.classes && myData.classes.length > 0) {
                    fetchNotices(myData.classes);
                }
            } else {
                setStats(null);
                setGlobalRank(0);
            }
        } catch (error) {
            setStats(null);
            if (error === 'jwt must be provided' || error === 'student session expired') {
                setAiAnalyzing(false);
            }
            console.error('Fetch student stats error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchNotices = async (studentClasses: any[]) => {
        try {
            const studentClassIds = studentClasses.map((c) => c.classId);

            const res = await http.get('/choiMath/notice/list', {
                params: { classIds: { $in: studentClassIds }, isNotice: true },
                disableLoading: true
            });
            const allNotices = res.data || [];
            setNotices(allNotices);
            return allNotices;
        } catch (error) {
            console.error('Fetch notices error:', error);
            return [];
        }
    };

    useEffect(() => {
        if (noticeRefreshSignal > 0 && stats?.classes) {
            fetchNotices(stats.classes).then((updatedNotices) => {
                if (updatedNotices.length > 0) {
                    const latest = updatedNotices[0];
                    // 실시간 신호가 오면 읽음 여부와 관계없이 혹은 최신 정보를 즉시 띄워줌
                    openModal({
                        id: 'noticeModal',
                        pData: {
                            notices: updatedNotices,
                            initialNoticeId: latest.noticeId
                        }
                    });
                    setHasCheckedNotice(true);
                }
            });
        }
    }, [noticeRefreshSignal]);

    useEffect(() => {
        if (notices.length > 0 && !hasCheckedNotice) {
            const latest = notices[0];
            const isRead = localStorage.getItem(`notice_read_${latest.noticeId}`);

            if (!isRead) {
                openModal({
                    id: 'noticeModal',
                    pData: {
                        notices: notices,
                        initialNoticeId: latest.noticeId
                    }
                });
            }
            setHasCheckedNotice(true);
        }
    }, [notices, hasCheckedNotice]);

    const handleShowNotices = () => {
        openModal({
            id: 'noticeModal',
            pData: { notices }
        });
    };

    const prepareChartData = (data: any) => {
        const classesHomework: { className: string; hwData: any; hwOptions: any; avgScore: number }[] = [];
        const classesAttendance: {
            className: string;
            attData: any;
            attOptions: any;
            total: number;
            percentage: number;
        }[] = [];

        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;
        let totalHwSum = 0;
        let totalHwCount = 0;

        if (data.classes && data.classes.length > 0) {
            data.classes.forEach((c: any) => {
                let classPresent = 0,
                    classAbsent = 0,
                    classLate = 0,
                    hwSum = 0,
                    hwCount = 0;

                c.attendance?.forEach((a: any) => {
                    if (a.status?.includes('present')) {
                        presentCount++;
                        classPresent++;
                    } else if (a.status?.includes('absent')) {
                        absentCount++;
                        classAbsent++;
                    } else if (a.status?.includes('late')) {
                        lateCount++;
                        classLate++;
                    }

                    if (a.status !== 'none' && a.homework !== undefined && a.homework !== null) {
                        hwSum += Number(a.homework);
                        hwCount++;
                        totalHwSum += Number(a.homework);
                        totalHwCount++;
                    }
                });

                const cTotalAtt = classPresent + classAbsent + classLate;
                if (c.className && cTotalAtt > 0) {
                    classesAttendance.push({
                        className: c.className,
                        attData: {
                            labels: ['출석', '결석', '지각'],
                            datasets: [
                                {
                                    data: [classPresent, classAbsent, classLate],
                                    backgroundColor: ['#4ade80', '#f87171', '#facc15'],
                                    borderWidth: 0
                                }
                            ]
                        },
                        attOptions: {
                            cutout: '70%',
                            layout: { padding: 0 },
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    position: 'nearest',
                                    yAlign: 'bottom',
                                    caretPadding: 10,
                                    displayColors: true,
                                    callbacks: { label: (ctx: any) => ` ${ctx.label}: ${ctx.raw}건` }
                                }
                            }
                        },
                        total: cTotalAtt,
                        percentage: Number(((classPresent / cTotalAtt) * 100).toFixed(1))
                    });
                }

                if (c.className && hwCount > 0) {
                    const avg = Number((hwSum / hwCount).toFixed(1));
                    classesHomework.push({
                        className: c.className,
                        hwData: {
                            labels: ['완료', '미완료'],
                            datasets: [
                                {
                                    data: [avg, 100 - avg],
                                    backgroundColor: ['#3b82f6', '#e2e8f0'],
                                    hoverBackgroundColor: ['#60a5fa', '#cbd5e1'],
                                    borderWidth: 0
                                }
                            ]
                        },
                        hwOptions: {
                            cutout: '70%',
                            plugins: {
                                legend: { display: false },
                                tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.label}: ${ctx.raw}%` } }
                            }
                        },
                        avgScore: avg
                    });
                }
            });
        }

        if (totalHwCount > 0) {
            const totalAvg = Number((totalHwSum / totalHwCount).toFixed(1));
            setTotalHomeworkAvg(totalAvg);
            classesHomework.push({
                className: '총 달성률',
                hwData: {
                    labels: ['완료', '미완료'],
                    datasets: [
                        {
                            data: [totalAvg, 100 - totalAvg],
                            backgroundColor: ['#6366f1', '#e2e8f0'],
                            hoverBackgroundColor: ['#818cf8', '#cbd5e1'],
                            borderWidth: 0
                        }
                    ]
                },
                hwOptions: {
                    cutout: '70%',
                    plugins: {
                        legend: { display: false },
                        tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.label}: ${ctx.raw}%` } }
                    }
                },
                avgScore: totalAvg
            });
        } else {
            setTotalHomeworkAvg(0);
        }

        const totalAttendance = presentCount + absentCount + lateCount;
        if (totalAttendance > 0) {
            classesAttendance.push({
                className: '총 출석현황',
                attData: {
                    labels: ['출석', '결석', '지각'],
                    datasets: [
                        {
                            data: [presentCount, absentCount, lateCount],
                            backgroundColor: ['#14b8a6', '#ef4444', '#eab308'],
                            borderWidth: 0
                        }
                    ]
                },
                attOptions: {
                    cutout: '70%',
                    plugins: {
                        legend: { display: false },
                        tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.label}: ${ctx.raw}건` } }
                    }
                },
                total: totalAttendance,
                percentage: Number(((presentCount / totalAttendance) * 100).toFixed(1))
            });
        }

        setChartData({ classesHomework, classesAttendance });
    };
    const handleLogout = () => {
        clearStudentAuth();
        window.location.reload();
    };

    const toggleDarkMode = () => {
        const isLight = layoutConfig.theme === 'lara-light-indigo';
        const newTheme = isLight ? 'lara-dark-indigo' : 'lara-light-indigo';
        const newColorScheme = isLight ? 'dark' : 'light';

        changeTheme?.(layoutConfig.theme, newTheme, 'theme-css', () => {
            setLayoutConfig((prevState) => ({ ...prevState, theme: newTheme, colorScheme: newColorScheme }));
        });
    };

    const getTrophy = (rank: number) => {
        const rankInfo = {
            1: { color: 'text-yellow-500', tooltip: '1위' },
            2: { color: 'text-gray-400', tooltip: '2위' },
            3: { color: 'text-orange-500', tooltip: '3위' }
        };

        if (rank >= 1 && rank <= 3) {
            const info = rankInfo[rank as 1 | 2 | 3];
            return <i className={`pi pi-trophy ${info.color} text-2xl trophy-icon`} data-pr-tooltip={info.tooltip} />;
        }
        return null;
    };

    const isTopRanker = useMemo(() => {
        if (globalRank > 0 && globalRank <= 3) return true;
        for (const rank of Object.values(classRanks)) {
            if (rank > 0 && rank <= 3) return true;
        }
        return false;
    }, [globalRank, classRanks]);

    useEffect(() => {
        if (highestRank > 0 && highestRank <= 3) {
            if (highestRank === 1) {
                setWinImage('/icons/profiles/profile_win2.png');
            } else if (highestRank === 2) {
                setWinImage('/icons/profiles/profile_win3.png');
            } else if (highestRank === 3) {
                setWinImage('/icons/profiles/profile_win.png');
            }
        } else {
            setWinImage('');
        }
    }, [highestRank]);

    useEffect(() => {
        const handlePopState = () => {
            if (showBadgePreview) {
                setShowBadgePreview(false);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [showBadgePreview]);

    const openBadgePreview = (e: React.MouseEvent) => {
        e.stopPropagation();
        window.history.pushState({ popup: 'badgePreview' }, '');
        setShowBadgePreview(true);
    };

    const closeBadgePreview = () => {
        setShowBadgePreview(false);
        if (window.history.state?.popup === 'badgePreview') {
            window.history.back();
        }
    };

    // 데이터가 아예 없을 때(최초 로딩 등)만 전체 스피너를 보여주고,
    // 데이터가 있는 상태에서 갱신할 때는 globalLoadingBar가 처리하도록 합니다.
    if (loading && !stats) {
        return (
            <div className="flex justify-content-center align-items-center min-h-screen">
                <img src="/layout/images/loading.gif" alt="Loading..." style={{ width: '200px' }} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent p-2 md:p-4 lg:p-6">
            <div className="max-w-7xl mx-auto">
                {/* 월 선택 UI */}
                <div className="flex align-items-center justify-content-center mb-4 gap-3">
                    <Button
                        icon="pi pi-chevron-left"
                        severity="secondary"
                        rounded
                        text
                        onClick={() => setCurrentDate((prev) => prev.subtract(1, 'month'))}
                    />
                    <div
                        className={`flex align-items-center gap-2 px-3 shadow-1 border-round-3xl ${
                            isDark ? 'surface-card' : 'bg-white'
                        }`}
                    >
                        <i className="pi pi-calendar text-primary text-xl ml-2"></i>
                        <Calendar
                            value={currentDate.toDate()}
                            onChange={(e) => e.value && setCurrentDate(dayjs(e.value as Date))}
                            view="month"
                            dateFormat="yy년 mm월"
                            inputClassName="border-none font-bold text-xl md:text-2xl text-900 bg-transparent text-center cursor-pointer p-2 w-full"
                            style={{ width: '170px' }}
                            readOnlyInput
                            locale="ko"
                            appendTo={'self'}
                            maxDate={new Date()}
                        />
                    </div>
                    <Button
                        icon="pi pi-chevron-right"
                        severity="secondary"
                        rounded
                        text
                        onClick={() => setCurrentDate((prev) => prev.add(1, 'month'))}
                        disabled={currentDate.isSame(dayjs(), 'month') || currentDate.isAfter(dayjs(), 'month')}
                    />
                    <Button
                        icon="pi pi-refresh"
                        severity="info"
                        rounded
                        text
                        onClick={() => setCurrentDate(dayjs())}
                        tooltip="이번 달로 이동"
                    />
                    <Button
                        icon={isDark ? 'pi pi-sun' : 'pi pi-moon'}
                        severity="warning"
                        rounded
                        text
                        onClick={toggleDarkMode}
                        tooltip={isDark ? '라이트 모드' : '다크 모드'}
                    />
                </div>

                <Card className="mb-5 shadow-1 border-round-2xl">
                    <div className="flex flex-column md:flex-row align-items-center justify-content-between gap-3">
                        <div className="flex align-items-center gap-3 w-full md:w-auto">
                            <div className="relative">
                                <div
                                    className="w-4rem h-4rem flex-shrink-0 border-circle bg-blue-100 flex align-items-center justify-content-center cursor-pointer hover:shadow-2 transition-duration-200 overflow-hidden"
                                    onClick={() => setShowProfileDialog(true)}
                                    title="프로필 변경"
                                >
                                    {profileImage ? (
                                        <img
                                            src={profileImage}
                                            alt="프로필"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <i className="pi pi-user text-blue-500 text-3xl"></i>
                                    )}
                                </div>
                                {isTopRanker && winImage && (
                                    <>
                                        <div
                                            className={`absolute flex align-items-center justify-content-center border-circle shadow-2 overflow-hidden hover:shadow-4 transition-duration-200 ${
                                                isDark ? 'surface-card' : 'bg-white'
                                            }`}
                                            style={{
                                                width: '28px',
                                                height: '28px',
                                                bottom: '-4px',
                                                right: '-4px',
                                                zIndex: 2,
                                                padding: '2px',
                                                cursor: 'pointer'
                                            }}
                                            onClick={openBadgePreview}
                                            title="클릭하여 배지 확대"
                                        >
                                            <img
                                                src={winImage}
                                                alt="Special Badge"
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    borderRadius: '50%',
                                                    display: 'block'
                                                }}
                                            />
                                        </div>
                                        <Dialog
                                            visible={showBadgePreview}
                                            onHide={closeBadgePreview}
                                            dismissableMask
                                            showHeader={false}
                                            contentStyle={{
                                                padding: 0,
                                                backgroundColor: 'transparent',
                                                overflow: 'hidden'
                                            }}
                                            style={{ background: 'transparent', boxShadow: 'none', border: 'none' }}
                                        >
                                            <img
                                                src={winImage}
                                                alt="Special Badge Preview"
                                                style={{
                                                    width: '80vw',
                                                    maxWidth: '400px',
                                                    height: 'auto',
                                                    display: 'block',
                                                    margin: '0 auto',
                                                    filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.5))'
                                                }}
                                            />
                                        </Dialog>
                                    </>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex align-items-center gap-2 flex-wrap">
                                    <h1 className="text-xl md:text-3xl font-bold m-0 text-900 white-space-nowrap">
                                        {finalName} 학생
                                    </h1>
                                    {getTrophy(globalRank)}
                                    <div className="flex align-items-center gap-1 flex-wrap">
                                        {(studentInfo.grade || finalGrade) &&
                                            (() => {
                                                const gradeVal = String(studentInfo.grade || finalGrade);
                                                const displayGrade = gradeVal.includes('학년')
                                                    ? gradeVal
                                                    : `${gradeVal}학년`;
                                                return (
                                                    <Tag
                                                        value={displayGrade}
                                                        className={`text-xs md:text-sm px-2 py-1 md:px-3 md:py-2 border-round-xl shadow-1 font-bold ${
                                                            displayGrade === '1학년'
                                                                ? 'bg-green-500'
                                                                : displayGrade === '2학년'
                                                                ? 'bg-indigo-500'
                                                                : displayGrade === '3학년'
                                                                ? 'bg-orange-500'
                                                                : 'bg-gray-500'
                                                        }`}
                                                        style={{
                                                            minWidth: '60px',
                                                            display: 'inline-flex',
                                                            justifyContent: 'center'
                                                        }}
                                                    />
                                                );
                                            })()}
                                        {(studentInfo.school || finalSchool) && (
                                            <Tag
                                                style={{
                                                    minWidth: '60px',
                                                    display: 'inline-flex',
                                                    justifyContent: 'center'
                                                }}
                                                value={studentInfo.school || finalSchool}
                                                severity="info"
                                                className="text-xs md:text-sm px-2 py-1 md:px-3 md:py-2 border-round-xl shadow-1 font-bold bg-blue-500"
                                            />
                                        )}
                                    </div>
                                </div>
                                <p className="text-500 m-0 mt-1 text-sm md:text-base">칭찬 현황을 확인해보세요!</p>
                            </div>
                        </div>

                        <div className="flex align-items-center gap-2 ml-auto md:ml-0">
                            <Button
                                label="공지사항"
                                icon="pi pi-bell"
                                severity="info"
                                size="small"
                                className="p-button-outlined border-round-xl p-1 px-2 text-xs"
                                style={{ height: '32px' }}
                                onClick={handleShowNotices}
                            >
                                {notices.length > 0 && (
                                    <span
                                        className="ml-1 bg-red-500 border-circle flex align-items-center justify-content-center text-white"
                                        style={{ width: '16px', height: '16px', fontSize: '10px' }}
                                    >
                                        {notices.length}
                                    </span>
                                )}
                            </Button>
                            <Button
                                icon="pi pi-sign-out"
                                severity="secondary"
                                text
                                rounded
                                aria-label="로그아웃"
                                tooltip="로그아웃"
                                tooltipOptions={{ position: 'bottom' }}
                                onClick={handleLogout}
                                className="hover:bg-gray-200"
                            />
                        </div>
                    </div>
                </Card>

                {/* 프로필 선택 다이얼로그 */}
                <ProfileSelectionDialog
                    visible={showProfileDialog}
                    onHide={() => setShowProfileDialog(false)}
                    profileIcons={profileIcons}
                    profileImage={profileImage}
                    onProfileChange={handleProfileChange}
                />

                {/* 서현준 학생 특별 팝업 */}
                <SpecialStudentPopup
                    visible={showSpecialModal}
                    onHide={() => setShowSpecialModal(false)}
                    studentName={finalName}
                />

                {stats && (
                    <AchievementCard
                        collapsed={true}
                        praiseTopRankers={praiseTopRankers}
                        totalPraiseCnt={stats.totalPraiseCnt || 0}
                        attendanceRate={attendanceRate}
                        totalHomeworkAvg={totalHomeworkAvg}
                        currentMonth={currentDate}
                    />
                )}

                {!stats ? (
                    <Card className="shadow-1 border-round-2xl">
                        <div className="flex flex-column justify-content-center align-items-center p-5">
                            <i className="pi pi-exclamation-circle text-orange-500 text-6xl mb-4"></i>
                            <h2 className="text-900 font-bold mb-2">데이터가 없습니다</h2>
                            <p className="text-600">
                                선택하신 월({currentDate.format('YYYY년 MM월')})에는 아직 기록이 없습니다.
                            </p>
                        </div>
                    </Card>
                ) : (
                    <>
                        {/* AI 학생 한줄평 영역 */}
                        <AIStudentComment aiAnalyzing={aiAnalyzing} aiProgress={aiProgress} aiComment={aiComment} />

                        {/* 학생 성취 하이라이트 */}
                        <StatsCardsRow
                            classes={stats.classes}
                            classRanks={classRanks}
                            totalPraiseCnt={stats.totalPraiseCnt || 0}
                            globalRank={globalRank}
                        />

                        {/* 차트 영역*/}
                        <ChartsRow chartData={chartData} />

                        {/* 클래스별 칭찬 및 출석 내역*/}
                        <DetailsTable
                            classes={stats.classes}
                            expandedRows={expandedRows}
                            onRowToggle={setExpandedRows}
                            classRanks={classRanks}
                        />

                        {/*주간 리포트 (REPORT) */}
                        <WeeklyReportList studentId={finalStudentId} />
                    </>
                )}
            </div>
        </div>
    );
};

export default withStudentAuth(StudentStatusContent);

export { StudentStatusContent };
