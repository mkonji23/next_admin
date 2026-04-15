'use client';

import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
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
                params: {
                    shareCount: { $gt: 0 }
                }
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

    const viewReport = (id: string) => {
        // 학생/학부모 뷰 페이지로 이동
        window.open(`/kakao-share/public-view/${id}`, '_blank');
    };

    const actionTemplate = (rowData: any) => {
        return (
            <Button
                icon="pi pi-external-link"
                label="보기"
                className="p-button-text p-button-sm"
                onClick={() => viewReport(rowData.publicUrl)}
            />
        );
    };

    const dateTemplate = (rowData: any) => {
        return dayjs(rowData.createdDate).format('YYYY-MM-DD');
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
                    <Column field="shareTitle" header="제목" />
                    <Column field="createdDate" header="등록일" body={dateTemplate} style={{ width: '120px' }} />
                    <Column body={actionTemplate} style={{ width: '120px', textAlign: 'center' }} />
                </DataTable>
            </Card>
        </div>
    );
};

export default WeeklyReportList;
