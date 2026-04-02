'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useHttp } from '@/util/axiosInstance';
import withStudentAuth, { StudentAuthData } from '@/components/hoc/withStudentAuth';
import { Chart } from 'primereact/chart';
import { Card } from 'primereact/card';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import dayjs from 'dayjs';
import { ATTENDANCE_STATUS_OPTIONS } from '@/constants/attendance';
import { AI_PROGRESS_MESSAGES, AI_STUDENT_COMMENTS } from '@/constants/aiComments';

interface StudentStatusContentProps {
    studentAuthData?: StudentAuthData;
}

const StudentStatusContent = ({ studentAuthData }: StudentStatusContentProps) => {
    const http = useHttp();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [chartData, setChartData] = useState<any>({});
    const [chartOptions, setChartOptions] = useState<any>({});
    const [expandedRows, setExpandedRows] = useState<any>({});
    const [globalRank, setGlobalRank] = useState<number>(0);
    const [classRanks, setClassRanks] = useState<Record<string, number>>({});
    const [studentInfo, setStudentInfo] = useState<{ school?: string; grade?: string }>({});
    const [aiAnalyzing, setAiAnalyzing] = useState(true);
    const [aiProgress, setAiProgress] = useState(0);

    const finalStudentId = studentAuthData?.studentId;
    const finalName = studentAuthData?.name;
    const finalPhone = studentAuthData?.phoneNumber;
    const finalSchool = studentAuthData?.school;
    const finalGrade = studentAuthData?.grade;

    useEffect(() => {
        if (finalStudentId) {
            fetchStudentStats();
        } else {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finalStudentId]);

    useEffect(() => {
        if (stats) {
            setAiAnalyzing(true);
            setAiProgress(0);
            // 5초(5000ms) ~ 7초(7000ms) 사이의 랜덤 딜레이 생성
            const totalTime = Math.floor(Math.random() * (7000 - 5000 + 1)) + 5000;
            const startTime = Date.now();

            const timer = setInterval(() => {
                const elapsed = Date.now() - startTime;
                let newProgress = Math.floor((elapsed / totalTime) * 100);

                if (newProgress >= 100) {
                    newProgress = 100;
                    clearInterval(timer);
                    setAiProgress(newProgress);
                    setTimeout(() => setAiAnalyzing(false), 400); // 100% 찍고 0.4초 대기 후 전환
                } else {
                    setAiProgress(newProgress);
                }
            }, 100);

            return () => clearInterval(timer);
        }
    }, [stats]);

    const aiComment = useMemo(() => {
        if (!stats) return '학습 데이터를 분석 중입니다...';

        let hwAvg = 0;
        if (chartData.classesHomework && chartData.classesHomework.length > 0) {
            const totalHw =
                chartData.classesHomework.find((h: any) => h.className === '총 달성률') || chartData.classesHomework[0];
            hwAvg = totalHw?.avgScore || 0;
        }

        let present = 0,
            absent = 0,
            late = 0;
        if (chartData.classesAttendance && chartData.classesAttendance.length > 0) {
            const totalAtt =
                chartData.classesAttendance.find((h: any) => h.className === '총 출석현황') ||
                chartData.classesAttendance[0];
            if (totalAtt?.attData?.datasets?.[0]) {
                [present, absent, late] = totalAtt.attData.datasets[0].data;
            }
        }
        const totalAttend = present + absent + late;
        const attendRate = totalAttend > 0 ? present / totalAttend : 0;
        const praise = stats.totalPraiseCnt || 0;

        if (totalAttend === 0 && hwAvg === 0 && praise === 0) {
            return '아직 분석할 학업 데이터가 충분하지 않습니다. 앞으로의 활약을 기대합니다! 🌱';
        }

        const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
        let comments: string[] = [];

        // 1. 출석 코멘트
        const { attendance, homework, praise: praiseComments } = AI_STUDENT_COMMENTS;

        if (attendRate >= 0.95) comments.push(getRandom(attendance.high));
        else if (attendRate >= 0.8) comments.push(getRandom(attendance.mid));
        else comments.push(getRandom(attendance.low));

        // 2. 과제 코멘트
        if (hwAvg >= 90) comments.push(getRandom(homework.high));
        else if (hwAvg >= 70) comments.push(getRandom(homework.mid));
        else comments.push(getRandom(homework.low));

        // 3. 칭찬 코멘트
        if (praise >= 10) comments.push(getRandom(praiseComments.high));
        else if (praise >= 3) comments.push(getRandom(praiseComments.mid));
        else comments.push(getRandom(praiseComments.low));

        return comments.join(' ');
    }, [stats, chartData]);

    const fetchStudentStats = async () => {
        setLoading(true);
        try {
            const params = {
                dateFrom: dayjs().startOf('year').format('YYYYMMDD'),
                dateTo: dayjs().endOf('year').format('YYYYMMDD')
                // 전체를 가져오기 위해 studentId 제외
            };

            const [praiseRes, studentRes] = await Promise.all([
                http.get('/choiMath/attendance/getPraiseStatistics', { params }),
                http.get('/choiMath/student/getStudentList', {
                    params: {
                        name: finalName,
                        phoneNumber: finalPhone
                    }
                })
            ]);

            const allData = praiseRes.data || [];

            const myData = allData.find((s: any) => s.studentId === finalStudentId);

            // 학생 상세 정보 찾기 (학교, 학년)
            const matchedStudent = studentRes.data?.find((s: any) => s.studentId === finalStudentId);
            if (matchedStudent) {
                setStudentInfo({ school: matchedStudent.school, grade: matchedStudent.grade });
            }

            if (myData) {
                setStats(myData);

                // 총 칭찬 순위 계산
                const sortedUniqueCounts = Array.from(new Set(allData.map((s: any) => s.totalPraiseCnt || 0))).sort(
                    (a: any, b: any) => b - a
                );
                const gRank = sortedUniqueCounts.indexOf(myData.totalPraiseCnt || 0) + 1;
                setGlobalRank(gRank);

                // 클래스별 순위 계산
                let cRanks: Record<string, number> = {};
                if (myData.classes && myData.classes.length > 0) {
                    myData.classes.forEach((myClass: any) => {
                        const classId = myClass.classId;
                        const myCount = myClass.attendance?.filter((a: any) => a.praise).length || 0;

                        // 이 클래스가 포함된 모든 학생의 해당 클래스 칭찬 횟수 추출
                        const allStudentsClassPraiseCounts = allData.map((s: any) => {
                            const c = s.classes?.find((cls: any) => cls.classId === classId);
                            return c?.attendance?.filter((a: any) => a.praise).length || 0;
                        });

                        const sortedClassUniqueCounts = Array.from(new Set(allStudentsClassPraiseCounts)).sort(
                            (a: any, b: any) => b - a
                        );
                        cRanks[classId] = sortedClassUniqueCounts.indexOf(myCount) + 1;
                    });
                }
                setClassRanks(cRanks);

                prepareChartData(myData);
            }
        } catch (error) {
            console.error('Error fetching student stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const prepareChartData = (data: any) => {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color') || '#495057';

        // 1. 출석, 과제 통계 집계 데이터 배열 선언
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
                let classPresent = 0;
                let classAbsent = 0;
                let classLate = 0;
                let hwSum = 0;
                let hwCount = 0;

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

                // 각 클래스별 출석 차트 생성
                const cTotalAtt = classPresent + classAbsent + classLate;
                if (c.className && cTotalAtt > 0) {
                    const cAttData = {
                        labels: ['출석', '결석', '지각'],
                        datasets: [
                            {
                                data: [classPresent, classAbsent, classLate],
                                backgroundColor: [
                                    documentStyle.getPropertyValue('--green-400') || '#4ade80',
                                    documentStyle.getPropertyValue('--red-400') || '#f87171',
                                    documentStyle.getPropertyValue('--yellow-400') || '#facc15'
                                ],
                                borderWidth: 0
                            }
                        ]
                    };
                    const cAttOptions = {
                        cutout: '70%',
                        // 1. 패딩을 최소화하거나 제거해서 차트 크기를 회복합니다.
                        layout: {
                            padding: 0
                        },
                        // 2. 차트가 캔버스 끝까지 꽉 차게 그립니다.
                        maintainAspectRatio: false,

                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                // 3. 핵심: 툴팁 위치를 'nearest'가 아닌 'center' 근처에서 '바깥쪽'으로 유도
                                position: 'nearest',

                                // 4. 화살표 방향을 '바깥쪽'으로 고정 (도넛 위/아래에 따라 자동 조절됨)
                                // 고정하고 싶다면 'bottom'을 쓰되, 패딩이 없으므로 잘릴 위험이 있습니다.
                                yAlign: 'bottom',

                                // 5. 간격을 너무 크게 잡으면 캔버스 밖으로 나가서 잘립니다. 적당히 조절!
                                caretPadding: 10,

                                displayColors: true,
                                callbacks: {
                                    label: (context) => ` ${context.label}: ${context.raw}건`
                                }
                            }
                        }
                    };
                    const percentage = Number(((classPresent / cTotalAtt) * 100).toFixed(1));
                    classesAttendance.push({
                        className: c.className,
                        attData: cAttData,
                        attOptions: cAttOptions,
                        total: cTotalAtt,
                        percentage
                    });
                }

                // 각 클래스별 과제 점수 차트 생성
                if (c.className && hwCount > 0) {
                    const avg = Number((hwSum / hwCount).toFixed(1));
                    const remaining = 100 - Number(avg);

                    const hwChartData = {
                        labels: ['완료', '미완료'],
                        datasets: [
                            {
                                data: [avg, remaining],
                                backgroundColor: [
                                    documentStyle.getPropertyValue('--blue-500') || '#3b82f6',
                                    documentStyle.getPropertyValue('--surface-200') || '#e2e8f0'
                                ],
                                hoverBackgroundColor: [
                                    documentStyle.getPropertyValue('--blue-400') || '#60a5fa',
                                    documentStyle.getPropertyValue('--surface-300') || '#cbd5e1'
                                ],
                                borderWidth: 0
                            }
                        ]
                    };

                    const hwChartOptions = {
                        cutout: '70%',
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                callbacks: {
                                    label: (context: any) => {
                                        return ` ${context.label}: ${context.raw}%`;
                                    }
                                }
                            }
                        }
                    };

                    classesHomework.push({
                        className: c.className,
                        hwData: hwChartData,
                        hwOptions: hwChartOptions,
                        avgScore: avg
                    });
                }
            });
        }

        // 총 달성률 (마지막 차트용)
        if (totalHwCount > 0) {
            const totalAvg = Number((totalHwSum / totalHwCount).toFixed(1));
            const totalRemaining = 100 - Number(totalAvg);

            const totalHwChartData = {
                labels: ['완료', '미완료'],
                datasets: [
                    {
                        data: [totalAvg, totalRemaining],
                        backgroundColor: [
                            documentStyle.getPropertyValue('--indigo-500') || '#6366f1',
                            documentStyle.getPropertyValue('--surface-200') || '#e2e8f0'
                        ],
                        hoverBackgroundColor: [
                            documentStyle.getPropertyValue('--indigo-400') || '#818cf8',
                            documentStyle.getPropertyValue('--surface-300') || '#cbd5e1'
                        ],
                        borderWidth: 0
                    }
                ]
            };

            const totalHwChartOptions = {
                cutout: '70%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context: any) => ` ${context.label}: ${context.raw}%`
                        }
                    }
                }
            };

            classesHomework.push({
                className: '총 달성률',
                hwData: totalHwChartData,
                hwOptions: totalHwChartOptions,
                avgScore: totalAvg
            });
        }

        const totalAttendance = presentCount + absentCount + lateCount;
        if (totalAttendance > 0) {
            const totalAttData = {
                labels: ['출석', '결석', '지각'],
                datasets: [
                    {
                        data: [presentCount, absentCount, lateCount],
                        backgroundColor: [
                            documentStyle.getPropertyValue('--teal-500') || '#14b8a6',
                            documentStyle.getPropertyValue('--red-500') || '#ef4444',
                            documentStyle.getPropertyValue('--yellow-500') || '#eab308'
                        ],
                        borderWidth: 0
                    }
                ]
            };
            const totalAttOptions = {
                cutout: '70%',
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (context: any) => ` ${context.label}: ${context.raw}건` } }
                }
            };
            const totalPercentage = Number(((presentCount / totalAttendance) * 100).toFixed(1));
            classesAttendance.push({
                className: '총 출석현황',
                attData: totalAttData,
                attOptions: totalAttOptions,
                total: totalAttendance,
                percentage: totalPercentage
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
        sessionStorage.removeItem('student_auth_id');
        sessionStorage.removeItem('student_auth_name');
        sessionStorage.removeItem('student_auth_school');
        sessionStorage.removeItem('student_auth_grade');
        sessionStorage.removeItem('student_auth_phone');
        window.location.reload();
    };

    const rowExpansionTemplate = (data: any) => {
        const filterAttendance = data?.attendance?.filter((item: any) => item.praise);

        return (
            <div className="p-3">
                <DataTable value={filterAttendance} emptyMessage="칭찬 내역이 없습니다.">
                    <Column
                        field="date"
                        header="날짜"
                        sortable
                        body={(rowData: any) => dayjs(rowData?.date).format('YYYY-MM-DD')}
                    />
                    <Column
                        field="status"
                        header="출석상태"
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
                    <Column field="homework" header="숙제" body={(rowData: any) => `${rowData?.homework || 0}%`} />
                    <Column
                        field="praise"
                        header="칭찬여부"
                        body={(rowData: any) =>
                            rowData.praise ? (
                                <i className="pi pi-face-smile text-green-500 text-2xl" />
                            ) : (
                                <i className="pi pi-minus text-400" />
                            )
                        }
                    />
                </DataTable>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-content-center align-items-center min-h-screen">
                <i className="pi pi-spin pi-spinner text-primary text-4xl"></i>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="flex flex-column justify-content-center align-items-center min-h-screen">
                <i className="pi pi-exclamation-circle text-orange-500 text-6xl mb-4"></i>
                <h2 className="text-900 font-bold mb-2">데이터가 없습니다</h2>
                <p className="text-600">아직 등록된 수강 내역이나 출석/칭찬 기록이 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent p-2 md:p-4 lg:p-6">
            {/* AI 학생 한줄평 영역 */}
            <div className="grid mt-2 mb-4">
                <div className="col-12">
                    <div
                        className="border-round-2xl shadow-1 p-4 flex flex-column align-items-center justify-content-center relative overflow-hidden"
                        style={{ minHeight: '140px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
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
                                            style={{ height: '18px', backgroundColor: 'rgba(255,255,255,0.2)' }}
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
                                    💡 AI 코치 코멘트: <br /> <span className="text-yellow-100">{aiComment}</span>
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto">
                <Card className="mb-5 shadow-1 border-round-2xl">
                    <div className="flex align-items-center justify-content-between">
                        <div className="flex align-items-center gap-3">
                            <div className="w-4rem h-4rem border-circle bg-blue-100 flex align-items-center justify-content-center">
                                <i className="pi pi-user text-blue-500 text-3xl"></i>
                            </div>
                            <div>
                                <h1 className="text-xl md:text-3xl font-bold m-0 text-900">{finalName} 학생</h1>
                                <p className="text-500 m-0 mt-1">칭찬 현황을 확인해보세요!</p>
                            </div>
                        </div>
                        <div className="flex flex-column align-items-end gap-2">
                            <div className="flex align-items-center gap-2">
                                {(studentInfo.grade || finalGrade) &&
                                    (() => {
                                        const gradeVal = String(studentInfo.grade || finalGrade);
                                        const displayGrade = gradeVal.includes('학년') ? gradeVal : `${gradeVal}학년`;
                                        return (
                                            <Tag
                                                style={{
                                                    minWidth: '70px', // 원하는 가로 사이즈로 조절하세요
                                                    display: 'inline-flex',
                                                    justifyContent: 'center'
                                                }}
                                                value={displayGrade}
                                                severity="info"
                                                className="text-sm px-3 py-2 border-round-xl shadow-1 font-bold bg-indigo-500"
                                            />
                                        );
                                    })()}
                                {(studentInfo.school || finalSchool) && (
                                    <Tag
                                        style={{
                                            minWidth: '70px', // 원하는 가로 사이즈로 조절하세요
                                            display: 'inline-flex',
                                            justifyContent: 'center'
                                        }}
                                        value={studentInfo.school || finalSchool}
                                        severity="info"
                                        className="text-sm px-3 py-2 border-round-xl shadow-1 font-bold bg-blue-500"
                                    />
                                )}
                                <Button
                                    icon="pi pi-sign-out"
                                    severity="secondary"
                                    text
                                    rounded
                                    aria-label="로그아웃"
                                    tooltip="로그아웃"
                                    tooltipOptions={{ position: 'bottom' }}
                                    onClick={handleLogout}
                                    className="ml-2 hover:bg-gray-200"
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="grid gap-4 mb-4" style={{ margin: 0 }}>
                    {stats.classes?.map((c: any) => {
                        const praiseCount = c.attendance?.filter((a: any) => a.praise).length || 0;
                        const rank = classRanks[c.classId] || 0;
                        return (
                            <div key={c.classId || c.className} className="col-12 sm:col-6 md:col lg:col flex-1 p-0">
                                <Card className="shadow-1 border-round-2xl h-full relative overflow-hidden">
                                    <div
                                        className="flex flex-column justify-content-center align-items-center"
                                        style={{ minHeight: '130px' }}
                                    >
                                        <div className="absolute top-0 right-0 p-3" style={{ opacity: 0.1 }}>
                                            <i className="pi pi-star-fill text-7xl text-blue-500"></i>
                                        </div>
                                        <h3 className="font-medium m-0 mb-3 z-1 text-center text-600">{c.className}</h3>
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

                    {/* 마지막에 총합 카드 표출 */}
                    <div className="col-12 sm:col-6 md:col lg:col flex-1 p-0">
                        <Card className="shadow-1 border-round-2xl h-full relative overflow-hidden border-2 border-yellow-400">
                            <div
                                className="flex flex-column justify-content-center align-items-center"
                                style={{ minHeight: '130px' }}
                            >
                                <div className="absolute top-0 right-0 p-3" style={{ opacity: 0.1 }}>
                                    <i className="pi pi-star-fill text-7xl text-yellow-500"></i>
                                </div>
                                <h3 className="font-medium m-0 mb-3 z-1 text-center text-800 text-xl">총 칭찬 배지</h3>
                                <div className="flex align-items-center gap-2 z-1 mb-3">
                                    <i className="pi pi-star-fill text-5xl mr-2 drop-shadow-md text-yellow-500"></i>
                                    <span className="text-6xl font-black text-900">{stats.totalPraiseCnt || 0}</span>
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

                <div className="grid">
                    <div className="col-12 xl:col-6">
                        <Card title="클래스별 출석 현황" className="h-full border-none shadow-1 border-round-2xl">
                            {chartData.classesAttendance && chartData.classesAttendance.length > 0 ? (
                                <div className="grid justify-content-center">
                                    {chartData.classesAttendance.map((ca: any, idx: number) => {
                                        const isTotal = ca.className === '총 출석현황';
                                        return (
                                            <div key={idx} className="col-12 sm:col-6 md:col-4 mb-4">
                                                <div className="text-center flex flex-column align-items-center p-2">
                                                    <span
                                                        className={`font-bold mb-3 text-overflow-ellipsis overflow-hidden white-space-nowrap w-full ${
                                                            isTotal ? 'text-teal-600 text-lg' : 'text-700 text-base'
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
                        <Card title="클래스별 과제 달성률" className="h-full border-none shadow-1 border-round-2xl">
                            {chartData.classesHomework && chartData.classesHomework.length > 0 ? (
                                <div className="grid justify-content-center">
                                    {chartData.classesHomework.map((hc: any, idx: number) => {
                                        const isTotal = hc.className === '총 달성률';
                                        return (
                                            <div key={idx} className="col-12 sm:col-6 md:col-4 mb-4">
                                                <div className="text-center flex flex-column align-items-center p-2">
                                                    <span
                                                        className={`font-bold mb-3 text-overflow-ellipsis overflow-hidden white-space-nowrap w-full ${
                                                            isTotal ? 'text-indigo-600 text-lg' : 'text-700 text-base'
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
                                                                    isTotal ? 'text-indigo-600' : 'text-blue-500'
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

                {/* 칭찬 내역 리스트 */}
                <div className="grid mt-2">
                    <div className="col-12">
                        <Card
                            title="클래스별 칭찬 내역 상세"
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
                                                    <i className="pi pi-trophy ml-1" style={{ color: trophyColor }}></i>
                                                )}
                                            </div>
                                        );
                                    }}
                                />
                            </DataTable>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default withStudentAuth(StudentStatusContent);

export { StudentStatusContent };
