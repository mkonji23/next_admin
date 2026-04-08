'use client';

import React from 'react';
import { Panel } from 'primereact/panel';
import { Tooltip } from 'primereact/tooltip';
import dayjs, { Dayjs } from 'dayjs';

interface AchievementCardProps {
    praiseTopRankers: any[];
    totalPraiseCnt: number;
    attendanceRate: number;
    totalHomeworkAvg: number;
    currentMonth: Dayjs;
    collapsed?: boolean;
}

const AchievementCard = ({
    praiseTopRankers,
    totalPraiseCnt,
    attendanceRate,
    totalHomeworkAvg,
    currentMonth,
    collapsed = false
}: AchievementCardProps) => {
    const headerTemplate = (options: any) => {
        const toggleIcon = options.collapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up';
        return (
            <div className="flex align-items-center justify-content-between p-3 bg-white border-bottom-1 border-gray-200">
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-trophy text-yellow-500 text-xl"></i>
                    <span className="font-bold text-lg">{currentMonth.format('M월')}의 명예의 전당</span>
                </div>
                <button className={options.togglerClassName} onClick={options.onTogglerClick}>
                    <span className={toggleIcon}></span>
                </button>
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

    return (
        <div className="mb-5">
            <Tooltip target=".trophy-icon" position="top" />
            <Panel
                headerTemplate={headerTemplate}
                toggleable
                collapsed={collapsed}
                className="shadow-1 border-round-2xl overflow-hidden"
            >
                <div className="grid p-3">
                    {/* 칭찬 랭킹 */}
                    <div className="col-12 md:col-6">
                        <div className="p-3 bg-gray-50 border-round-lg h-full">
                            <h3 className="font-bold text-lg mt-0 mb-3 text-center text-gray-700">
                                ✨ 이달의 칭찬 랭킹 ✨
                            </h3>
                            <ul className="list-none p-0 m-0">
                                {praiseTopRankers.map((ranker, index) => (
                                    <li
                                        key={ranker.studentId}
                                        className="flex align-items-center justify-content-between p-3 mb-2 bg-white border-round-lg shadow-1"
                                    >
                                        <div className="flex align-items-center">
                                            <div className="flex-shrink-0 mr-3">{getTrophy(ranker?.rank)}</div>
                                            <div className="font-bold text-lg text-gray-800">{ranker.name}</div>
                                        </div>
                                        <div className="flex align-items-center">
                                            <i className="pi pi-star-fill text-blue-400 mr-2" />
                                            <span className="font-bold text-xl text-blue-500">
                                                {ranker.totalPraiseCnt}
                                            </span>
                                            <span className="ml-1 text-gray-600">개</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* 나의 성취 */}
                    <div className="col-12 md:col-6">
                        <div className="p-3 bg-gray-50 border-round-lg h-full">
                            <h3 className="font-bold text-lg mt-0 mb-3 text-center text-gray-700">
                                🚀 나의 월별 요약 🚀
                            </h3>
                            <div className="flex flex-column gap-3">
                                <div className="flex justify-content-between align-items-center p-3 bg-white border-round-lg shadow-1">
                                    <div className="flex align-items-center">
                                        <i className="pi pi-heart-fill text-red-500 text-2xl mr-3" />
                                        <span className="font-bold text-lg text-gray-800 white-space-nowrap">
                                            총 칭찬
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-black text-2xl text-red-500">{totalPraiseCnt}개</div>
                                    </div>
                                </div>
                                <div className="flex justify-content-between align-items-center p-3 bg-white border-round-lg shadow-1">
                                    <div className="flex align-items-center">
                                        <i className="pi pi-check-circle text-green-500 text-2xl mr-3" />
                                        <span className="font-bold text-lg text-gray-800 white-space-nowrap">
                                            출석률
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-black text-2xl text-green-500">{attendanceRate}%</div>
                                    </div>
                                </div>
                                <div className="flex justify-content-between align-items-center p-3 bg-white border-round-lg shadow-1">
                                    <div className="flex align-items-center">
                                        <i className="pi pi-book text-indigo-500 text-2xl mr-4" />
                                        <span className="font-bold text-lg text-gray-800 white-space-nowrap">
                                            과제 달성률
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-black text-2xl text-indigo-500">{totalHomeworkAvg}%</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Panel>
        </div>
    );
};

export default AchievementCard;
