'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useHttp } from '@/util/axiosInstance';
import withStudentAuth, { StudentAuthData } from '@/components/hoc/withStudentAuth';
import { Chart } from 'primereact/chart';
import { Card } from 'primereact/card';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Image } from 'primereact/image';
import dayjs, { Dayjs } from 'dayjs';
import { ATTENDANCE_STATUS_OPTIONS } from '@/constants/attendance';
import { AI_PROGRESS_MESSAGES, AI_STUDENT_COMMENTS } from '@/constants/aiComments';
import AchievementCard from './AchievementCard';
import WeeklyReportList from './WeeklyReportList';
import useStudentAuthStore from '@/store/useStudentAuthStore';
import { useCustomModal } from '@/hooks/useCustomModal';
import { LayoutContext } from '@/layout/context/layoutcontext';
import { useContext } from 'react';

interface StudentStatusContentProps {
    studentAuthData?: StudentAuthData;
}

const StudentStatusContent = ({ studentAuthData }: StudentStatusContentProps) => {
    const http = useHttp();
    const { clearStudentAuth } = useStudentAuthStore();
    const { layoutConfig, setLayoutConfig } = useContext(LayoutContext);
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
        setLoading(true);
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
                handleLogout();
            }
            console.error('Error fetching student stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchNotices = async (studentClasses: any[]) => {
        try {
            const res = await http.get('/choiMath/notice/list', { disableLoading: true });
            const allNotices = res.data || [];
            const studentClassIds = studentClasses.map((c) => c.classId);

            // Filter: isNotice === true AND matching classId
            const filtered = allNotices.filter((n: any) => {
                if (!n.isNotice) return false;

                const targetIds = n.targetClassIds || [];
                if (targetIds.length === 0) return true;

                return studentClassIds.some((id) => targetIds.includes(id));
            });

            setNotices(filtered);
        } catch (error) {
            console.error('Fetch notices error:', error);
        }
    };

    useEffect(() => {
        if (notices.length > 0 && !hasCheckedNotice) {
            const latest = notices[0];
            const isRead = localStorage.getItem(`notice_read_${latest.noticeId}`);

            if (!isRead) {
                openModal({
                    id: 'notice',
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
            id: 'notice',
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

    const getAttendanceSeverity = (status: string) => {
        switch (status) {
            case 'class_present':
                return 'success';
            case 'class_absent':
                return 'danger';
            case 'late':
                return 'warning';
            default:
                return 'info';
        }
    };

    const handleLogout = () => {
        clearStudentAuth();
        window.location.reload();
    };

    const toggleDarkMode = () => {
        const newColorScheme = isDark ? 'light' : 'dark';
        const newTheme = isDark ? 'lara-light-indigo' : 'lara-dark-indigo';

        setLayoutConfig((prevConfig) => ({
            ...prevConfig,
            colorScheme: newColorScheme,
            theme: newTheme
        }));
    };


    const rowExpansionTemplate = (data: any) => {
        const filterAttendance = data?.attendance?.filter((item: any) => item.status !== 'none' || item.praise);

        return (
            <div className="p-3">
                <DataTable value={filterAttendance} emptyMessage="칭찬,출석 내역이 없습니다.">
                    <Column
                        field="date"
                        header="날짜"
                        headerStyle={{ minWidth: '120px' }}
                        sortable
                        body={(rowData: any) => dayjs(rowData?.date).format('YYYY-MM-DD')}
                    />
                    <Column
                        field="status"
                        header="출석상태"
                        headerStyle={{ minWidth: '100px' }}
                        sortable
                        body={(rowData: any) => (
                            <Tag
                                value={
                                    ATTENDANCE_STATUS_OPTIONS.find((opt) => opt.value === rowData.status)?.label ||
                                    '없음'
                                }
                                severity={getAttendanceSeverity(rowData.status || '')}
                            />
                        )}
                    />
                    <Column
                        sortable
                        field="homework"
                        headerStyle={{ minWidth: '80px' }}
                        header="숙제"
                        body={(rowData: any) => `${rowData?.homework || 0}%`}
                    />
                    <Column
                        sortable
                        field="praise"
                        header="칭찬여부"
                        align={'center'}
                        headerStyle={{ minWidth: '100px' }}
                        body={(rowData: any) =>
                            rowData.praise ? (
                                <i className="pi pi-face-smile text-green-500 text-2xl" />
                            ) : (
                                <i className="pi pi-minus text-400" />
                            )
                        }
                    />
                    <Column
                        sortable
                        field="note"
                        headerStyle={{ minWidth: '120px', textAlign: 'center' }}
                        header="비고"
                        alignHeader={'center'}
                    />
                </DataTable>
            </div>
        );
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

    if (loading) {
        return (
            <div className="flex justify-content-center align-items-center min-h-screen">
                <i className="pi pi-spin pi-spinner text-primary text-4xl"></i>
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
                    <div className={`flex align-items-center gap-2 px-3 shadow-1 border-round-3xl ${isDark ? 'surface-card' : 'bg-white'}`}>
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
                        />
                    </div>
                    <Button
                        icon="pi pi-chevron-right"
                        severity="secondary"
                        rounded
                        text
                        onClick={() => setCurrentDate((prev) => prev.add(1, 'month'))}
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
                    <div className="flex align-items-center justify-content-between">
                        <div className="flex align-items-center gap-3">
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
                                            className={`absolute flex align-items-center justify-content-center border-circle shadow-2 overflow-hidden hover:shadow-4 transition-duration-200 ${isDark ? 'surface-card' : 'bg-white'}`}
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
                            <div>
                                <div className="flex align-items-center gap-2 flex-wrap">
                                    <h1 className="text-xl md:text-3xl font-bold m-0 text-900">{finalName} 학생</h1>
                                    {getTrophy(globalRank)}
                                </div>

                                <p className="text-500 m-0 mt-1">칭찬 현황을 확인해보세요!</p>
                            </div>
                            <div className="ml-2 mt-1">
                                <Button
                                    label="공지사항"
                                    icon="pi pi-bell"
                                    severity="info"
                                    size="small"
                                    className="p-button-outlined border-round-xl p-1 px-2 text-xs"
                                    style={{ height: '24px' }}
                                    onClick={handleShowNotices}
                                >
                                    {notices.length > 0 && (
                                        <span
                                            className="ml-1 bg-red-500 border-circle flex align-items-center justify-content-center text-white"
                                            style={{ width: '14px', height: '14px', fontSize: '9px' }}
                                        >
                                            {notices.length}
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </div>
                        <div className="flex flex-column align-items-end gap-2">
                            <div className="flex align-items-center gap-3">
                                <div className="flex flex-column align-items-end gap-2">
                                    {(studentInfo.grade || finalGrade) &&
                                        (() => {
                                            const gradeVal = String(studentInfo.grade || finalGrade);
                                            const displayGrade = gradeVal.includes('학년')
                                                ? gradeVal
                                                : `${gradeVal}학년`;
                                            return (
                                                <Tag
                                                    value={displayGrade}
                                                    className={`text-sm px-3 py-2 border-round-xl shadow-1 font-bold ${
                                                        displayGrade === '1학년'
                                                            ? 'bg-green-500'
                                                            : displayGrade === '2학년'
                                                            ? 'bg-indigo-500'
                                                            : displayGrade === '3학년'
                                                            ? 'bg-orange-500'
                                                            : 'bg-gray-500'
                                                    }`}
                                                    style={{
                                                        minWidth: '70px',
                                                        display: 'inline-flex',
                                                        justifyContent: 'center'
                                                    }}
                                                />
                                            );
                                        })()}
                                    {(studentInfo.school || finalSchool) && (
                                        <Tag
                                            style={{
                                                minWidth: '70px',
                                                display: 'inline-flex',
                                                justifyContent: 'center'
                                            }}
                                            value={studentInfo.school || finalSchool}
                                            severity="info"
                                            className="text-sm px-3 py-2 border-round-xl shadow-1 font-bold bg-blue-500"
                                        />
                                    )}
                                </div>
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
                    </div>
                </Card>

                {/* 프로필 선택 다이얼로그 */}
                <Dialog
                    header="프로필 아이콘 선택"
                    visible={showProfileDialog}
                    onHide={() => setShowProfileDialog(false)}
                    style={{ width: '90vw', maxWidth: '400px' }}
                    draggable={false}
                    resizable={false}
                    dismissableMask
                >
                    <div className="grid justify-content-center gap-3 py-3">
                        {profileIcons.map((icon, idx) => (
                            <div
                                key={idx}
                                className={`col-3 flex flex-column align-items-center cursor-pointer p-2 border-round hover:surface-100 transition-duration-200 ${
                                    profileImage === icon.value ? 'bg-blue-50 border-1 border-blue-500' : ''
                                }`}
                                onClick={() => handleProfileChange(icon.value)}
                            >
                                <div className="w-4rem h-4rem border-circle bg-blue-100 flex align-items-center justify-content-center overflow-hidden mb-2">
                                    {icon.value ? (
                                        <img
                                            src={icon.value}
                                            alt={icon.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <i className="pi pi-user text-blue-500 text-2xl"></i>
                                    )}
                                </div>
                                <span className="text-xs text-700">{icon.name}</span>
                            </div>
                        ))}
                    </div>
                </Dialog>

                {/* 서현준 학생 특별 팝업 */}
                <Dialog
                    visible={showSpecialModal}
                    onHide={() => setShowSpecialModal(false)}
                    showHeader={false}
                    style={{ width: '90vw', maxWidth: '600px' }}
                    contentStyle={{ padding: 0, borderRadius: '24px', overflow: 'hidden' }}
                    dismissableMask
                >
                    <div className="relative">
                        <img
                            src="/images/special/hj.png"
                            alt="Welcome"
                            className="w-full h-auto block"
                            style={{ maxHeight: '80vh', objectFit: 'contain' }}
                        />
                        <Button
                            icon="pi pi-times"
                            className="absolute top-0 right-0 m-3 p-button-rounded p-button-secondary p-button-text bg-white-alpha-20 hover:bg-white-alpha-40 transition-duration-200"
                            onClick={() => setShowSpecialModal(false)}
                            style={{ color: 'white', backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                        />
                        <div
                            className="absolute bottom-0 left-0 w-full p-4 flex flex-column align-items-center"
                            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}
                        >
                            <h2 className="text-white font-bold m-0 mb-2">반가워요, 서현준 학생! 👋</h2>
                            <p className="text-white-alpha-80 m-0 text-sm">최선을 다하는 당신을 응원합니다.</p>
                        </div>
                    </div>
                </Dialog>

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
                        <div className="grid mt-2 mb-4">
                            <div className="col-12">
                                <div
                                    className="border-round-2xl shadow-1 p-4 flex flex-column align-items-center justify-content-center relative overflow-hidden"
                                    style={{
                                        minHeight: '140px',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                    }}
                                >
                                    <div className="absolute top-0 right-0 p-3" style={{ opacity: 0.1 }}>
                                        <i className="pi pi-sparkles text-8xl text-white"></i>
                                    </div>
                                    <div className="absolute bottom-0 left-0 p-3" style={{ opacity: 0.1 }}>
                                        <i className="pi pi-bolt text-7xl text-white"></i>
                                    </div>

                                    {aiAnalyzing ? (
                                        (() => {
                                            const currentMessage =
                                                AI_PROGRESS_MESSAGES.find((m) => aiProgress < m.threshold)?.message ||
                                                AI_PROGRESS_MESSAGES[AI_PROGRESS_MESSAGES.length - 1].message;

                                            return (
                                                <div className="w-full md:w-8 z-1 flex flex-column align-items-center">
                                                    <span className="text-yellow-200 font-bold mb-3 text-base md:text-xl text-center">
                                                        <i className="pi pi-cog pi-spin mr-2"></i>
                                                        {currentMessage}
                                                    </span>
                                                    <ProgressBar
                                                        value={aiProgress}
                                                        className="w-full border-round-3xl shadow-1"
                                                        style={{
                                                            height: '18px',
                                                            backgroundColor: 'rgba(255,255,255,0.2)'
                                                        }}
                                                        color="#facc15"
                                                        displayValueTemplate={(val) => (
                                                            <span className="text-xs text-800 font-bold">{val}%</span>
                                                        )}
                                                    />
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <div className="flex align-items-center gap-3 z-1 w-full justify-content-center">
                                            <i className="pi pi-sparkles text-3xl md:text-5xl text-yellow-300 drop-shadow-md"></i>
                                            <span
                                                className="text-lg md:text-2xl font-bold text-white line-height-3 text-center"
                                                style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.3)' }}
                                            >
                                                💡 AI 코치 코멘트: <br />{' '}
                                                <span className="text-yellow-100">{aiComment}</span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards Row */}
                        <div className="grid gap-4 mb-4 pb-2" style={{ margin: 0 }}>
                            {stats.classes?.map((c: any) => {
                                const praiseCount = c.attendance?.filter((a: any) => a.praise).length || 0;
                                const rank = classRanks[c.classId] || 0;
                                return (
                                    <div
                                        key={c.classId || c.className}
                                        className="col-12 sm:col-6 md:col lg:col flex-1 p-0"
                                    >
                                        <Card className="shadow-1 border-round-2xl h-full relative overflow-hidden">
                                            <div
                                                className="flex flex-column justify-content-center align-items-center"
                                                style={{ minHeight: '130px' }}
                                            >
                                                <div className="absolute top-0 right-0 p-3" style={{ opacity: 0.1 }}>
                                                    <i className="pi pi-star-fill text-7xl text-blue-500"></i>
                                                </div>
                                                <h3 className="font-medium m-0 mb-3 z-1 text-center text-600">
                                                    {c.className}
                                                </h3>
                                                <div className="flex align-items-center gap-2 z-1 mb-3">
                                                    <i className="pi pi-star-fill text-4xl drop-shadow-md text-blue-400"></i>
                                                    <span className="text-5xl font-black text-900">{praiseCount}</span>
                                                    <span className="text-lg text-600 font-bold mt-2">개</span>
                                                </div>
                                                {rank > 0 ? (
                                                    <Tag
                                                        value={`${rank}위`}
                                                        severity={rank <= 3 ? 'warning' : 'info'}
                                                        className={`px-3 py-1 text-sm border-round-xl ${
                                                            rank <= 3 ? 'bg-yellow-500 text-white' : ''
                                                        }`}
                                                    />
                                                ) : (
                                                    <Tag
                                                        value="순위 없음"
                                                        severity="info"
                                                        className="px-3 py-1 text-sm border-round-xl"
                                                    />
                                                )}
                                            </div>
                                        </Card>
                                    </div>
                                );
                            })}

                            <div className="col-12 sm:col-6 md:col lg:col flex-1 p-0">
                                <Card className="shadow-1 border-round-2xl h-full relative overflow-hidden border-2 border-yellow-400">
                                    <div
                                        className="flex flex-column justify-content-center align-items-center"
                                        style={{ minHeight: '130px' }}
                                    >
                                        <div className="absolute top-0 right-0 p-3" style={{ opacity: 0.1 }}>
                                            <i className="pi pi-star-fill text-7xl text-yellow-500"></i>
                                        </div>
                                        <h3 className="font-medium m-0 mb-3 z-1 text-center text-800 text-xl">
                                            총 칭찬 배지
                                        </h3>
                                        <div className="flex align-items-center gap-2 z-1 mb-3">
                                            <i className="pi pi-star-fill text-5xl mr-2 drop-shadow-md text-yellow-500"></i>
                                            <span className="text-6xl font-black text-900">
                                                {stats.totalPraiseCnt || 0}
                                            </span>
                                            <span className="text-lg text-600 font-bold mt-2">개</span>
                                        </div>
                                        <Tag
                                            value={`종합 ${globalRank}위`}
                                            severity={globalRank <= 3 ? 'warning' : 'info'}
                                            className={`px-3 py-1 text-sm border-round-xl ${
                                                globalRank <= 3 ? 'bg-yellow-500 text-white' : ''
                                            }`}
                                        />
                                    </div>
                                </Card>
                            </div>
                        </div>

                        {/* Charts Row */}
                        <div className="grid">
                            <div className="col-12 xl:col-6">
                                <Card
                                    title="클래스별 출석 현황"
                                    className="h-full border-none shadow-1 border-round-2xl"
                                >
                                    {chartData.classesAttendance && chartData.classesAttendance.length > 0 ? (
                                        <div className="grid justify-content-center pb-2">
                                            {chartData.classesAttendance.map((ca: any, idx: number) => {
                                                const isTotal = ca.className === '총 출석현황';
                                                return (
                                                    <div key={idx} className="col-12 sm:col-6 md:col-4 mb-4">
                                                        <div className="text-center flex flex-column align-items-center p-2">
                                                            <span
                                                                className={`font-bold mb-3 text-overflow-ellipsis overflow-hidden white-space-nowrap w-full ${
                                                                    isTotal
                                                                        ? 'text-teal-600 text-lg'
                                                                        : 'text-700 text-base'
                                                                }`}
                                                                title={ca.className}
                                                            >
                                                                {ca.className}
                                                            </span>
                                                            <div
                                                                className="relative"
                                                                style={{ width: '130px', height: '130px' }}
                                                            >
                                                                <Chart
                                                                    type="doughnut"
                                                                    data={ca.attData}
                                                                    options={ca.attOptions}
                                                                    className="w-full h-full"
                                                                />
                                                                <div
                                                                    className="absolute top-50 left-50"
                                                                    style={{ transform: 'translate(-50%, -50%)' }}
                                                                >
                                                                    <span
                                                                        className={`font-bold text-xl ${
                                                                            isTotal ? 'text-teal-600' : 'text-green-500'
                                                                        }`}
                                                                    >
                                                                        {ca.percentage}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center p-5 text-500">
                                            <i className="pi pi-calendar text-4xl mb-3 block"></i>
                                            출석 데이터가 없습니다.
                                        </div>
                                    )}
                                </Card>
                            </div>

                            <div className="col-12 xl:col-6">
                                <Card
                                    title="클래스별 과제 달성률"
                                    className="h-full border-none shadow-1 border-round-2xl"
                                >
                                    {chartData.classesHomework && chartData.classesHomework.length > 0 ? (
                                        <div className="grid justify-content-center pb-2">
                                            {chartData.classesHomework.map((hc: any, idx: number) => {
                                                const isTotal = hc.className === '총 달성률';
                                                return (
                                                    <div key={idx} className="col-12 sm:col-6 md:col-4 mb-4">
                                                        <div className="text-center flex flex-column align-items-center p-2">
                                                            <span
                                                                className={`font-bold mb-3 text-overflow-ellipsis overflow-hidden white-space-nowrap w-full ${
                                                                    isTotal
                                                                        ? 'text-indigo-600 text-lg'
                                                                        : 'text-700 text-base'
                                                                }`}
                                                                title={hc.className}
                                                            >
                                                                {hc.className}
                                                            </span>
                                                            <div
                                                                className="relative"
                                                                style={{ width: '130px', height: '130px' }}
                                                            >
                                                                <Chart
                                                                    type="doughnut"
                                                                    data={hc.hwData}
                                                                    options={hc.hwOptions}
                                                                    className="w-full h-full"
                                                                />
                                                                <div
                                                                    className="absolute top-50 left-50"
                                                                    style={{ transform: 'translate(-50%, -50%)' }}
                                                                >
                                                                    <span
                                                                        className={`font-bold text-xl ${
                                                                            isTotal
                                                                                ? 'text-indigo-600'
                                                                                : 'text-blue-500'
                                                                        }`}
                                                                    >
                                                                        {hc.avgScore}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center p-5 text-500">
                                            <i className="pi pi-file-edit text-4xl mb-3 block"></i>
                                            과제 데이터가 없습니다.
                                        </div>
                                    )}
                                </Card>
                            </div>
                        </div>

                        {/* Details Table */}
                        <div className="grid mt-2">
                            <div className="col-12">
                                <Card
                                    title="클래스별 칭찬 및 출석 내역"
                                    className="border-none shadow-1 border-round-2xl overflow-hidden"
                                >
                                    <DataTable
                                        value={stats.classes}
                                        expandedRows={expandedRows}
                                        onRowToggle={(e) => setExpandedRows(e.data)}
                                        rowExpansionTemplate={rowExpansionTemplate}
                                        dataKey="classId"
                                        emptyMessage="수강 중인 클래스가 없습니다."
                                        className="p-datatable-sm"
                                    >
                                        <Column expander style={{ width: '3em' }} />
                                        <Column field="className" header="클래스명" sortable />
                                        <Column
                                            header="칭찬 횟수"
                                            body={(rowData) => {
                                                const praiseCount =
                                                    rowData.attendance?.filter((a: any) => a.praise).length || 0;
                                                return (
                                                    <Tag
                                                        value={`${praiseCount}회`}
                                                        severity={praiseCount > 0 ? 'success' : 'info'}
                                                    />
                                                );
                                            }}
                                        />
                                        <Column
                                            header="순위"
                                            body={(rowData) => {
                                                const rank = classRanks[rowData.classId] || 0;
                                                if (rank === 0) return <span>-</span>;
                                                let textColor = 'text-600';
                                                let trophyColor = '';
                                                if (rank === 1) {
                                                    textColor = 'text-yellow-600';
                                                    trophyColor = '#FFD700';
                                                } else if (rank === 2) {
                                                    textColor = 'text-gray-500';
                                                    trophyColor = '#C0C0C0';
                                                } else if (rank === 3) {
                                                    textColor = 'text-orange-600';
                                                    trophyColor = '#CD7F32';
                                                }

                                                return (
                                                    <div className={`flex align-items-center font-bold ${textColor}`}>
                                                        {rank}위
                                                        {rank <= 3 && (
                                                            <i
                                                                className="pi pi-trophy ml-1"
                                                                style={{ color: trophyColor }}
                                                            ></i>
                                                        )}
                                                    </div>
                                                );
                                            }}
                                        />
                                    </DataTable>
                                </Card>
                            </div>
                        </div>

                        {/* Weekly Report List */}
                        <WeeklyReportList studentId={finalStudentId} />
                    </>
                )}
            </div>
        </div>
    );
};

export default withStudentAuth(StudentStatusContent);

export { StudentStatusContent };
