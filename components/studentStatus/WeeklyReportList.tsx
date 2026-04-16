'use client';

import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useHttp } from '@/util/axiosInstance';
import dayjs from 'dayjs';

interface WeeklyReportListProps {
    studentId?: string;
}

const WeeklyReportList = ({ studentId }: WeeklyReportListProps) => {
    const http = useHttp();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (studentId) {
            fetchReports();
        }
    }, [studentId]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await http.get('/choiMath/share/list', {
                params: { shareCount: { $gt: 0 }, studentId: studentId },
                disableLoading: true
            });
            const allShares = res.data || [];

            // 학생 본인의 리포트만 필터링
            const myReports = allShares.filter((item: any) => item.studentId === studentId);

            // 최신순 정렬
            myReports.sort((a: any, b: any) => dayjs(b.createdDate).valueOf() - dayjs(a.createdDate).valueOf());

            setReports(myReports);
        } catch (error) {
            console.error('Error fetching weekly reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const viewReport = (publicUrl: string) => {
        if (!publicUrl) return;
        // 학생/학부모 뷰 페이지로 이동
        window.open(`/kakao-share/public-view/${publicUrl}`, '_blank');
    };

    const titleTemplate = (rowData: any) => {
        return (
            <div className="flex align-items-center gap-2">
                <span
                    className="text-blue-500 font-bold cursor-pointer hover:underline"
                    onClick={() => viewReport(rowData.publicUrl)}
                >
                    {rowData.shareTitle}
                </span>
                {!rowData?.isRead && (
                    <span
                        className="bg-red-500 text-white flex align-items-center justify-content-center font-bold"
                        style={{
                            borderRadius: '50%',
                            width: '1.2rem',
                            height: '1.2rem',
                            fontSize: '0.7rem',
                            flexShrink: 0
                        }}
                    >
                        N
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className="mt-4">
            <Card title="주간 리포트 (REPORT)" className="shadow-1 border-round-2xl">
                <DataTable
                    value={reports}
                    loading={loading}
                    emptyMessage="등록된 주간 리포트가 없습니다."
                    className="p-datatable-sm"
                    paginator
                    rows={5}
                >
                    <Column field="shareTitle" header="제목" body={titleTemplate} />
                </DataTable>
            </Card>
        </div>
    );
};

export default WeeklyReportList;
