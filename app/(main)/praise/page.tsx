'use client';

import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card } from 'primereact/card';
import { Chart } from 'primereact/chart';

// 칭찬페이지
const PraisePage = () => {
    const [events, setEvents] = useState([]);
    const [totalStudyTime, setTotalStudyTime] = useState(0);
    const [totalPraises, setTotalPraises] = useState(0);
    const [studyTimeRank, setStudyTimeRank] = useState(1);
    const [praiseRank, setPraiseRank] = useState(1);
    const [praiseChartData, setPraiseChartData] = useState({});
    const [praiseChartOptions, setPraiseChartOptions] = useState({});
    const [studyTimeChartData, setStudyTimeChartData] = useState({});
    const [studyTimeChartOptions, setStudyTimeChartOptions] = useState({});

    useEffect(() => {
        // Mock data for a month
        const mockMonthlyData = Array.from({ length: 30 }, (_, i) => {
            const day = i + 1;
            return {
                date: `2026-01-${day < 10 ? '0' + day : day}`,
                day: day,
                studyTime: Math.random() * 5,
                praises: Math.floor(Math.random() * 10)
            };
        });

        const mockEvents = mockMonthlyData.map((d) => ({
            title: `공부: ${d.studyTime.toFixed(1)}시간, 칭찬: ${d.praises}개`,
            start: d.date,
            studyTime: d.studyTime,
            praises: d.praises
        }));

        setEvents(mockEvents);

        const totalStudy = mockEvents.reduce((acc, cur) => acc + cur.studyTime, 0);
        const totalPraise = mockEvents.reduce((acc, cur) => acc + cur.praises, 0);

        setTotalStudyTime(totalStudy);
        setTotalPraises(totalPraise);

        // Mock rankings
        setStudyTimeRank(3);
        setPraiseRank(2);

        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

        const labels = mockMonthlyData.map((d) => d.day);
        const studyTimeData = mockMonthlyData.map((d) => d.studyTime);
        const praiseData = mockMonthlyData.map((d) => d.praises);

        const praiseDataConfig = {
            labels: labels,
            datasets: [
                {
                    label: '칭찬개수',
                    data: praiseData,
                    fill: false,
                    borderColor: documentStyle.getPropertyValue('--pink-500'),
                    tension: 0.4
                }
            ]
        };
        const praiseOptionsConfig = {
            maintainAspectRatio: false,
            aspectRatio: 0.6,
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder
                    },
                    title: {
                        display: true,
                        text: '일',
                        color: textColorSecondary
                    }
                },
                y: {
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder
                    },
                    title: {
                        display: true,
                        text: '개수',
                        color: textColorSecondary
                    }
                }
            }
        };

        const studyTimeDataConfig = {
            labels: labels,
            datasets: [
                {
                    label: '공부시간',
                    data: studyTimeData,
                    fill: false,
                    borderColor: documentStyle.getPropertyValue('--blue-500'),
                    tension: 0.4
                }
            ]
        };

        const studyTimeOptionsConfig = {
            maintainAspectRatio: false,
            aspectRatio: 0.6,
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder
                    },
                    title: {
                        display: true,
                        text: '일',
                        color: textColorSecondary
                    }
                },
                y: {
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder
                    },
                    title: {
                        display: true,
                        text: '시간',
                        color: textColorSecondary
                    }
                }
            }
        };

        setPraiseChartData(praiseDataConfig);
        setPraiseChartOptions(praiseOptionsConfig);
        setStudyTimeChartData(studyTimeDataConfig);
        setStudyTimeChartOptions(studyTimeOptionsConfig);
    }, []);

    const renderEventContent = (eventInfo) => {
        return (
            <>
                <i>{eventInfo.event.title}</i>
            </>
        );
    };

    return (
        <div className="grid">
            <div className="col-12 md:col-6">
                <Card title="총 공부시간">
                    <div className="flex justify-content-between">
                        <p className="m-0">{totalStudyTime.toFixed(1)} 시간</p>
                        <p className="m-0">{studyTimeRank} 위</p>
                    </div>
                </Card>
            </div>
            <div className="col-12 md:col-6">
                <Card title="받은 칭찬개수">
                    <div className="flex justify-content-between">
                        <p className="m-0">{totalPraises} 개</p>
                        <p className="m-0">{praiseRank} 위</p>
                    </div>
                </Card>
            </div>

            <div className="col-12 md:col-6">
                <div className="card">
                    <h5>칭찬개수</h5>
                    <Chart type="line" data={praiseChartData} options={praiseChartOptions}></Chart>
                </div>
            </div>
            <div className="col-12 md:col-6">
                <div className="card">
                    <h5>공부시간</h5>
                    <Chart type="line" data={studyTimeChartData} options={studyTimeChartOptions}></Chart>
                </div>
            </div>

            <div className="col-12">
                <div className="card">
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay'
                        }}
                        events={events}
                        eventContent={renderEventContent}
                        locale="ko"
                    />
                </div>
            </div>
        </div>
    );
};

export default PraisePage;
