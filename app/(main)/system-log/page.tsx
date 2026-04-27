'use client';

import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { FilterMatchMode } from 'primereact/api';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import dayjs from 'dayjs';

interface SystemLog {
    createdDate: string;
    fullUrl: string;
    method: string;
    ip: string;
    status: number;
    hostname: string;
    userAgent: string;
    userId: string;
    userName: string;
}

const SystemLogPage = () => {
    const http = useHttp();
    const { showToast } = useToast();
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [loading, setLoading] = useState(false);

    // Search states
    const [dateRange, setDateRange] = useState<any[]>([dayjs().startOf('day').toDate(), dayjs().endOf('day').toDate()]);
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });

    const fetchLogs = async () => {
        try {
            setLoading(true);

            const filter: any = {};

            if (dateRange && dateRange[0]) {
                const startDate = dayjs(dateRange[0]);
                const endDate = dateRange[1] ? dayjs(dateRange[1]) : startDate.endOf('day');

                filter.createdDate = {
                    $gte: startDate.toDate(),
                    $lte: endDate.toDate()
                };
            }

            const response = await http.post('/system/logs', {
                filter,
                options: {
                    sort: { createdDate: -1 }
                }
            });

            setLogs(response.data.logs || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
            showToast({
                severity: 'error',
                summary: '조회 실패',
                detail: '시스템 로그를 불러오는데 실패했습니다.'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const formatDate = (dateString: string) => {
        return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss');
    };

    const statusBodyTemplate = (rowData: SystemLog) => {
        const status = rowData.status;
        let color = 'text-green-500';
        if (status >= 400) color = 'text-red-500';
        else if (status >= 300) color = 'text-yellow-500';

        return <span className={`font-bold ${color}`}>{status}</span>;
    };

    const header = (
        <div className="flex flex-column gap-3">
            <div className="flex flex-wrap align-items-center justify-content-between gap-2">
                <span className="text-xl font-bold">시스템 로그 ({logs.length}건)</span>
                <div className="flex gap-2">
                    <span className="p-input-icon-left">
                        <i className="pi pi-search" />
                        <InputText
                            value={globalFilterValue}
                            onChange={onGlobalFilterChange}
                            placeholder="전체 검색..."
                            className="p-inputtext-sm"
                        />
                    </span>
                    <Button
                        icon="pi pi-search"
                        label="조회"
                        onClick={fetchLogs}
                        loading={loading}
                        className="p-button-success"
                    />
                </div>
            </div>
            <div className="flex flex-wrap align-items-center gap-3 surface-50 p-3 border-round">
                <div className="flex align-items-center gap-2">
                    <label htmlFor="dateRange" className="font-bold">
                        기간 선택:
                    </label>
                    <Calendar
                        id="dateRange"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.value as any[])}
                        dateFormat="yy-mm-dd"
                        selectionMode="range"
                        showTime
                        showIcon
                        placeholder="기간 및 시간 선택"
                        className="w-full md:w-30rem"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="card">
            <DataTable
                value={logs}
                header={header}
                loading={loading}
                paginator
                rows={20}
                rowsPerPageOptions={[20, 50, 100]}
                filters={filters}
                globalFilterFields={['fullUrl', 'method', 'ip', 'userId', 'userName', 'hostname', 'userAgent']}
                emptyMessage="로그 데이터가 없습니다."
                dataKey="createdDate"
                sortField="createdDate"
                sortOrder={-1}
                removableSort
                showGridlines
                responsiveLayout="scroll"
                className="p-datatable-sm"
            >
                <Column
                    field="createdDate"
                    header="날짜/시간"
                    sortable
                    body={(row) => formatDate(row.createdDate)}
                    headerStyle={{ minWidth: '160px' }}
                />
                <Column field="userName" header="사용자" sortable headerStyle={{ minWidth: '120px' }} />
                <Column field="userId" header="ID" sortable style={{ width: '100px' }} />
                <Column field="method" header="Method" sortable style={{ width: '80px' }} />
                <Column field="status" header="Status" sortable body={statusBodyTemplate} style={{ width: '80px' }} />
                <Column field="fullUrl" header="URL" sortable />
                <Column field="ip" header="IP" sortable style={{ width: '120px' }} />
                <Column field="hostname" header="Host" sortable style={{ width: '150px' }} />
                <Column
                    field="userAgent"
                    header="UserAgent"
                    style={{ maxWidth: '500px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    body={(row) => <span title={row.userAgent}>{row.userAgent}</span>}
                />
            </DataTable>
        </div>
    );
};

export default SystemLogPage;
