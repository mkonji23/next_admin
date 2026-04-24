'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';

interface StatsCardsRowProps {
    classes: any[];
    classRanks: Record<string, number>;
    totalPraiseCnt: number;
    globalRank: number;
}

const StatsCardsRow: React.FC<StatsCardsRowProps> = ({ classes, classRanks, totalPraiseCnt, globalRank }) => {
    return (
        <div className="grid gap-4 mb-4 pb-2" style={{ margin: 0 }}>
            {classes?.map((c: any) => {
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
                                    <Tag value="순위 없음" severity="info" className="px-3 py-1 text-sm border-round-xl" />
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
                        <h3 className="font-medium m-0 mb-3 z-1 text-center text-800 text-xl">총 칭찬 배지</h3>
                        <div className="flex align-items-center gap-2 z-1 mb-3">
                            <i className="pi pi-star-fill text-5xl mr-2 drop-shadow-md text-yellow-500"></i>
                            <span className="text-6xl font-black text-900">{totalPraiseCnt}</span>
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
    );
};

export default StatsCardsRow;
