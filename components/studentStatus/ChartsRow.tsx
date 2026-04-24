'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { Chart } from 'primereact/chart';

interface ChartsRowProps {
    chartData: any;
}

const ChartsRow: React.FC<ChartsRowProps> = ({ chartData }) => {
    return (
        <div className="grid">
            <div className="col-12 xl:col-6">
                <Card title="클래스별 출석 현황" className="h-full border-none shadow-1 border-round-2xl">
                    {chartData.classesAttendance && chartData.classesAttendance.length > 0 ? (
                        <div className="grid justify-content-center pb-2">
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
                                            <div className="relative" style={{ width: '130px', height: '130px' }}>
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
                        <div className="grid justify-content-center pb-2">
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
                                            <div className="relative" style={{ width: '130px', height: '130px' }}>
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
    );
};

export default ChartsRow;
