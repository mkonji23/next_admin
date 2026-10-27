'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { TabView, TabPanel } from 'primereact/tabview';
import { Tooltip } from 'primereact/tooltip';
import { FilterMatchMode } from 'primereact/api';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import dayjs from 'dayjs';

interface SystemLog {
    _id?: string;
    createdDate: string;
    fullUrl: string;
    path?: string;
    method: string;
    ip: string;
    status: number;
    durationMs?: number;
    hostname?: string;
    userAgent?: string;
    userId?: string;
    userName?: string;
    authType?: string;
    queryParams?: Record<string, any> | null;
    requestBody?: any;
    responseBody?: any;
    headers?: Record<string, any>;
}

const SystemLogPage = () => {
    const http = useHttp();
    const { showToast } = useToast();
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [totalServerCount, setTotalServerCount] = useState<number>(0);
    const [loading, setLoading] = useState(false);

    // 기간 검색 상태 (기본값: 오늘 00:00:00 ~ 오늘 23:59:59)
    const [dateRange, setDateRange] = useState<any[]>([
        dayjs().startOf('day').toDate(),
        dayjs().endOf('day').toDate()
    ]);

    // 조회 건수 옵션 (0: 기간 내 전체)
    const limitOptions = [
        { label: '기간 내 전체 (최대 10,000건)', value: 0 },
        { label: '3,000건', value: 3000 },
        { label: '1,000건 (기본)', value: 1000 },
        { label: '500건', value: 500 },
        { label: '100건', value: 100 }
    ];
    const [selectedLimit, setSelectedLimit] = useState<number>(0);

    // HTTP 상태 필터 (전체, 에러만, 성공만)
    const statusOptions = [
        { label: '모든 상태 (전체)', value: 'ALL' },
        { label: '에러만 (4xx, 5xx)', value: 'ERROR' },
        { label: '성공만 (2xx, 3xx)', value: 'SUCCESS' }
    ];
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    // 검색 및 필터 상태
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });

    // Row Expansion (행 확장) 상태
    const [expandedRows, setExpandedRows] = useState<any>(null);

    // 상세 모달 상태
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);

    // 시스템 로그 데이터 조회
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
                    limit: selectedLimit,
                    sort: { createdDate: -1 }
                }
            });

            const fetchedLogs: SystemLog[] = response.data.logs || [];
            setLogs(fetchedLogs);
            setTotalServerCount(response.data.total ?? fetchedLogs.length);

            showToast({
                severity: 'info',
                summary: '조회 완료',
                detail: `총 ${fetchedLogs.length}건의 로그를 불러왔습니다. (기간 내 전체: ${response.data.total || fetchedLogs.length}건)`
            });
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 상태 필터링 적용된 로그 목록
    const filteredLogs = useMemo(() => {
        if (statusFilter === 'ERROR') {
            return logs.filter((l) => l.status >= 400);
        }
        if (statusFilter === 'SUCCESS') {
            return logs.filter((l) => l.status < 400);
        }
        return logs;
    }, [logs, statusFilter]);

    // 전체 검색어 변경 핸들러
    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const _filters = { ...filters };
        _filters['global'].value = value as any;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const formatDate = (dateString: string) => {
        return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss');
    };

    // JSON 복사 헬퍼
    const copyToClipboard = (text: string, title = '복사 완료') => {
        navigator.clipboard.writeText(text);
        showToast({
            severity: 'success',
            summary: title,
            detail: '클립보드에 복사되었습니다.'
        });
    };

    // 포맷팅된 JSON 문자열 반환 헬퍼
    const stringifyJson = (val: any) => {
        if (val === undefined || val === null) return '';
        if (typeof val === 'string') {
            try {
                return JSON.stringify(JSON.parse(val), null, 2);
            } catch (_) {
                return val;
            }
        }
        return JSON.stringify(val, null, 2);
    };

    // Method 뱃지 렌더러
    const methodBodyTemplate = (rowData: SystemLog) => {
        const m = (rowData.method || 'GET').toUpperCase();
        let severity: 'info' | 'success' | 'warning' | 'danger' | null = 'info';
        if (m === 'POST') severity = 'success';
        else if (m === 'PUT' || m === 'PATCH') severity = 'warning';
        else if (m === 'DELETE') severity = 'danger';

        return <Tag severity={severity} value={m} className="font-bold text-xs" />;
    };

    // Status 뱃지 렌더러
    const statusBodyTemplate = (rowData: SystemLog) => {
        const status = rowData.status;
        let severity: 'success' | 'info' | 'warning' | 'danger' | null = 'success';
        if (status >= 500) severity = 'danger';
        else if (status >= 400) severity = 'warning';
        else if (status >= 300) severity = 'info';

        return (
            <Tag
                severity={severity}
                value={String(status)}
                className="font-bold text-xs"
                style={{ minWidth: '2.8rem' }}
            />
        );
    };

    // 소요시간 (durationMs) 렌더러
    const durationBodyTemplate = (rowData: SystemLog) => {
        if (rowData.durationMs === undefined || rowData.durationMs === null) return <span className="text-400">-</span>;
        const ms = rowData.durationMs;
        let color = '#16a34a'; // 초록
        if (ms >= 1000) color = '#dc2626'; // 1초 이상 빨강
        else if (ms >= 400) color = '#d97706'; // 400ms 이상 주황

        return (
            <span className="font-semibold text-xs" style={{ color }}>
                {ms} ms
            </span>
        );
    };

    // Payload 유무 아이콘 / 뱃지 렌더러
    const payloadPreviewTemplate = (rowData: SystemLog) => {
        const hasQuery = Boolean(rowData.queryParams && Object.keys(rowData.queryParams).length > 0);
        const hasBody = Boolean(rowData.requestBody && Object.keys(rowData.requestBody).length > 0);
        const hasResponse = Boolean(rowData.responseBody !== undefined && rowData.responseBody !== null);

        return (
            <div className="flex align-items-center gap-1">
                {hasQuery && (
                    <Tag
                        severity="info"
                        value="Query"
                        className="text-xs cursor-pointer hover:shadow-2 transition-duration-150"
                        title="Query 파라미터 있음 (클릭 시 상세 모달)"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(rowData);
                            setModalVisible(true);
                        }}
                    />
                )}
                {hasBody && (
                    <Tag
                        severity="success"
                        value="Body"
                        className="text-xs cursor-pointer hover:shadow-2 transition-duration-150"
                        title="Request Body 있음 (클릭 시 상세 모달)"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(rowData);
                            setModalVisible(true);
                        }}
                    />
                )}
                {hasResponse && (
                    <Tag
                        severity={rowData.status >= 400 ? 'danger' : null}
                        value="Res"
                        className="text-xs cursor-pointer hover:shadow-2 transition-duration-150"
                        style={{
                            background: rowData.status >= 400 ? undefined : '#e2e8f0',
                            color: rowData.status >= 400 ? undefined : '#334155'
                        }}
                        title="Response Body 있음 (클릭 시 상세 모달)"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(rowData);
                            setModalVisible(true);
                        }}
                    />
                )}
                {!hasQuery && !hasBody && !hasResponse && <span className="text-400 text-xs">-</span>}
            </div>
        );
    };

    // 액션 컬럼 (상세보기 버튼)
    const actionBodyTemplate = (rowData: SystemLog) => {
        return (
            <Button
                icon="pi pi-search-plus"
                size="small"
                rounded
                text
                severity="info"
                tooltip="전체 상세 보기 (모달)"
                tooltipOptions={{ position: 'top' }}
                onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLog(rowData);
                    setModalVisible(true);
                }}
            />
        );
    };

    // 📋 Row Expansion 템플릿 (각 행 클릭 시 펼쳐지는 상세 패널)
    const rowExpansionTemplate = (data: SystemLog) => {
        const formattedQuery = stringifyJson(data.queryParams);
        const formattedBody = stringifyJson(data.requestBody);
        const formattedRes = stringifyJson(data.responseBody);
        const formattedHeaders = stringifyJson(data.headers);

        return (
            <div className="p-3 surface-50 border-round-lg shadow-1 my-2">
                <div className="flex flex-wrap align-items-center justify-content-between gap-2 pb-2 mb-3 border-bottom-1 surface-border">
                    <div className="flex align-items-center gap-2">
                        {methodBodyTemplate(data)}
                        {statusBodyTemplate(data)}
                        <strong className="text-sm font-mono word-break-all">{data.fullUrl}</strong>
                    </div>
                    <div className="flex align-items-center gap-2">
                        <Button
                            label="JSON 전체 복사"
                            icon="pi pi-copy"
                            size="small"
                            outlined
                            className="p-button-sm font-semibold"
                            onClick={() => copyToClipboard(JSON.stringify(data, null, 2), '전체 로그 복사')}
                        />
                        <Button
                            label="팝업으로 크게 보기"
                            icon="pi pi-window-maximize"
                            size="small"
                            className="p-button-sm font-semibold"
                            onClick={() => {
                                setSelectedLog(data);
                                setModalVisible(true);
                            }}
                        />
                    </div>
                </div>

                <div className="grid">
                    {/* 1. Request Body */}
                    <div className="col-12 md:col-6">
                        <div className="surface-card p-3 border-round border-1 surface-border h-full">
                            <div className="flex align-items-center justify-content-between mb-2 pb-1 border-bottom-1 surface-border">
                                <span className="font-bold text-xs text-primary flex align-items-center gap-1">
                                    <i className="pi pi-upload" /> Request Body (요청 본문)
                                </span>
                                {formattedBody && (
                                    <Button
                                        icon="pi pi-copy"
                                        size="small"
                                        text
                                        rounded
                                        tooltip="Body 복사"
                                        onClick={() => copyToClipboard(formattedBody, 'Request Body 복사')}
                                    />
                                )}
                            </div>
                            {formattedBody ? (
                                <pre
                                    className="m-0 p-2 border-round surface-100 font-mono text-xs overflow-auto select-all"
                                    style={{ maxHeight: '220px', lineHeight: '1.4' }}
                                >
                                    {formattedBody}
                                </pre>
                            ) : (
                                <span className="text-500 text-xs italic">요청 Body 데이터가 없습니다.</span>
                            )}
                        </div>
                    </div>

                    {/* 2. Response Body */}
                    <div className="col-12 md:col-6">
                        <div
                            className="surface-card p-3 border-round border-1 h-full"
                            style={{
                                borderColor: data.status >= 400 ? 'rgba(239, 68, 68, 0.4)' : undefined
                            }}
                        >
                            <div className="flex align-items-center justify-content-between mb-2 pb-1 border-bottom-1 surface-border">
                                <span
                                    className="font-bold text-xs flex align-items-center gap-1"
                                    style={{ color: data.status >= 400 ? '#ef4444' : '#16a34a' }}
                                >
                                    <i className="pi pi-download" /> Response Body (응답 본문 - {data.status})
                                </span>
                                {formattedRes && (
                                    <Button
                                        icon="pi pi-copy"
                                        size="small"
                                        text
                                        rounded
                                        tooltip="Response 복사"
                                        onClick={() => copyToClipboard(formattedRes, 'Response Body 복사')}
                                    />
                                )}
                            </div>
                            {formattedRes ? (
                                <pre
                                    className="m-0 p-2 border-round surface-100 font-mono text-xs overflow-auto select-all"
                                    style={{ maxHeight: '220px', lineHeight: '1.4' }}
                                >
                                    {formattedRes}
                                </pre>
                            ) : (
                                <span className="text-500 text-xs italic">응답 Body 데이터가 없습니다.</span>
                            )}
                        </div>
                    </div>

                    {/* 3. Query Params & Meta */}
                    <div className="col-12 md:col-6">
                        <div className="surface-card p-3 border-round border-1 surface-border h-full">
                            <div className="flex align-items-center justify-content-between mb-2 pb-1 border-bottom-1 surface-border">
                                <span className="font-bold text-xs text-600 flex align-items-center gap-1">
                                    <i className="pi pi-link" /> Query Parameters (쿼리 파라미터)
                                </span>
                                {formattedQuery && (
                                    <Button
                                        icon="pi pi-copy"
                                        size="small"
                                        text
                                        rounded
                                        tooltip="Query 복사"
                                        onClick={() => copyToClipboard(formattedQuery, 'Query 복사')}
                                    />
                                )}
                            </div>
                            {formattedQuery ? (
                                <pre
                                    className="m-0 p-2 border-round surface-100 font-mono text-xs overflow-auto select-all"
                                    style={{ maxHeight: '160px', lineHeight: '1.4' }}
                                >
                                    {formattedQuery}
                                </pre>
                            ) : (
                                <span className="text-500 text-xs italic">Query 파라미터가 없습니다.</span>
                            )}
                        </div>
                    </div>

                    {/* 4. Request Headers & Client Info */}
                    <div className="col-12 md:col-6">
                        <div className="surface-card p-3 border-round border-1 surface-border h-full">
                            <div className="flex align-items-center justify-content-between mb-2 pb-1 border-bottom-1 surface-border">
                                <span className="font-bold text-xs text-600 flex align-items-center gap-1">
                                    <i className="pi pi-info-circle" /> 클라이언트 메타 & Headers
                                </span>
                                {formattedHeaders && (
                                    <Button
                                        icon="pi pi-copy"
                                        size="small"
                                        text
                                        rounded
                                        tooltip="Headers 복사"
                                        onClick={() => copyToClipboard(formattedHeaders, 'Headers 복사')}
                                    />
                                )}
                            </div>
                            <div className="flex flex-column gap-1 text-xs">
                                <div>
                                    <strong className="text-600">IP:</strong>{' '}
                                    <span className="font-mono">{data.ip || '-'}</span>
                                </div>
                                <div>
                                    <strong className="text-600">소요 시간:</strong>{' '}
                                    <span className="font-bold">{data.durationMs ? `${data.durationMs} ms` : '-'}</span>
                                </div>
                                <div>
                                    <strong className="text-600">사용자:</strong>{' '}
                                    <span>
                                        {data.userName || '-'} ({data.userId || '비로그인'}) [
                                        {data.authType || 'NONE'}]
                                    </span>
                                </div>
                                <div className="text-500 word-break-all mt-1" style={{ fontSize: '11px' }}>
                                    <strong className="text-600">User-Agent:</strong> {data.userAgent || '-'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // 상단 검색 & 필터 헤더
    const header = (
        <div className="flex flex-column gap-3">
            <Tooltip target=".log-info-tooltip" position="top" />
            <div className="flex flex-wrap align-items-center justify-content-between gap-3">
                <div className="flex flex-wrap align-items-baseline gap-2">
                    <span className="text-xl font-bold">시스템 로그</span>
                    <span className="text-sm font-semibold text-600">
                        (조회 결과: <strong className="text-primary">{filteredLogs.length}건</strong> / 기간 내 전체: {totalServerCount}건)
                    </span>
                </div>

                <div className="flex flex-wrap align-items-center gap-2">
                    <span className="p-input-icon-left">
                        <i className="pi pi-search" />
                        <InputText
                            value={globalFilterValue}
                            onChange={onGlobalFilterChange}
                            placeholder="URL, IP, 사용자, 내용 검색..."
                            className="p-inputtext-sm w-15rem md:w-20rem"
                        />
                    </span>
                    <Button
                        icon="pi pi-refresh"
                        label="조회"
                        onClick={fetchLogs}
                        loading={loading}
                        className="p-button-success p-button-sm font-bold"
                    />
                </div>
            </div>

            {/* 필터 옵션 바 */}
            <div className="flex flex-wrap align-items-center justify-content-between gap-3 surface-50 p-3 border-round border-1 surface-border">
                {/* 1. 기간 선택 */}
                <div className="flex flex-wrap align-items-center gap-2">
                    <label htmlFor="dateRange" className="font-bold text-xs text-700 white-space-nowrap">
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
                        className="p-inputtext-sm w-full sm:w-24rem"
                    />
                </div>

                {/* 2. 조회 건수 (Limit) 선택 드롭다운 */}
                <div className="flex align-items-center gap-2">
                    <label htmlFor="limitSelect" className="font-bold text-xs text-700 white-space-nowrap">
                        조회 한도:
                    </label>
                    <Dropdown
                        id="limitSelect"
                        value={selectedLimit}
                        options={limitOptions}
                        onChange={(e) => setSelectedLimit(e.value)}
                        placeholder="조회 건수 선택"
                        className="p-inputtext-sm w-14rem"
                    />
                </div>

                {/* 3. HTTP 상태 필터 (에러만 / 성공만) */}
                <div className="flex align-items-center gap-2">
                    <label htmlFor="statusFilter" className="font-bold text-xs text-700 white-space-nowrap">
                        상태 필터:
                    </label>
                    <Dropdown
                        id="statusFilter"
                        value={statusFilter}
                        options={statusOptions}
                        onChange={(e) => setStatusFilter(e.value)}
                        className="p-inputtext-sm w-11rem"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="card shadow-2 border-round-xl">
            <DataTable
                value={filteredLogs}
                header={header}
                loading={loading}
                paginator
                rows={20}
                rowsPerPageOptions={[10, 20, 50, 100, 200, 500]}
                filters={filters}
                globalFilterFields={['fullUrl', 'path', 'method', 'ip', 'userId', 'userName', 'status', 'userAgent']}
                emptyMessage="조회된 로그 데이터가 없습니다."
                dataKey="_id"
                sortField="createdDate"
                sortOrder={-1}
                removableSort
                showGridlines
                responsiveLayout="scroll"
                className="p-datatable-sm"
                expandedRows={expandedRows}
                onRowToggle={(e) => setExpandedRows(e.data)}
                rowExpansionTemplate={rowExpansionTemplate}
            >
                <Column expander style={{ width: '3rem' }} />
                <Column
                    field="createdDate"
                    header="날짜/시간"
                    sortable
                    body={(row) => formatDate(row.createdDate)}
                    style={{ width: '155px', whiteSpace: 'nowrap' }}
                />
                <Column
                    field="method"
                    header="Method"
                    sortable
                    body={methodBodyTemplate}
                    style={{ width: '75px', textAlign: 'center' }}
                />
                <Column
                    field="status"
                    header="Status"
                    sortable
                    body={statusBodyTemplate}
                    style={{ width: '75px', textAlign: 'center' }}
                />
                <Column
                    field="durationMs"
                    header="소요시간"
                    sortable
                    body={durationBodyTemplate}
                    style={{ width: '85px', textAlign: 'right' }}
                />
                <Column
                    field="userName"
                    header="사용자"
                    sortable
                    body={(row) => (
                        <div className="flex flex-column text-xs">
                            <span className="font-bold text-900">{row.userName || '-'}</span>
                            <span className="text-500 font-mono" style={{ fontSize: '10px' }}>
                                {row.userId || '비로그인'}
                            </span>
                        </div>
                    )}
                    style={{ width: '130px' }}
                />
                <Column
                    field="fullUrl"
                    header="Request URL"
                    sortable
                    body={(row) => (
                        <div className="text-xs font-mono word-break-all" title={row.fullUrl}>
                            {row.fullUrl}
                        </div>
                    )}
                />
                <Column
                    header="Payload"
                    body={payloadPreviewTemplate}
                    style={{ width: '130px', textAlign: 'center' }}
                />
                <Column
                    field="ip"
                    header="IP"
                    sortable
                    style={{ width: '110px', fontSize: '11px', fontFamily: 'monospace' }}
                />
                <Column
                    header="상세"
                    body={actionBodyTemplate}
                    style={{ width: '50px', textAlign: 'center' }}
                />
            </DataTable>

            {/* 🔍 [상세 보기 팝업 모달] */}
            <Dialog
                visible={modalVisible}
                onHide={() => setModalVisible(false)}
                header={
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-file text-primary text-xl" />
                        <span className="font-bold text-base">로그 상세 전체 보기</span>
                        {selectedLog && (
                            <>
                                {methodBodyTemplate(selectedLog)}
                                {statusBodyTemplate(selectedLog)}
                                <span className="font-mono text-sm text-600 word-break-all">
                                    {selectedLog.fullUrl}
                                </span>
                            </>
                        )}
                    </div>
                }
                style={{ width: '90vw', maxWidth: '1000px' }}
                modal
                footer={
                    <div className="flex justify-content-between align-items-center w-full">
                        <Button
                            label="JSON 전체 복사"
                            icon="pi pi-copy"
                            outlined
                            onClick={() =>
                                copyToClipboard(JSON.stringify(selectedLog, null, 2), '전체 로그 복사')
                            }
                        />
                        <Button
                            label="닫기"
                            icon="pi pi-times"
                            severity="secondary"
                            onClick={() => setModalVisible(false)}
                        />
                    </div>
                }
            >
                {selectedLog && (
                    <TabView className="pt-2">
                        {/* 탭 1: Request Body */}
                        <TabPanel
                            header={
                                <div className="flex align-items-center gap-2">
                                    <i className="pi pi-upload" />
                                    <span>Request Body</span>
                                    {selectedLog.requestBody && (
                                        <Tag severity="success" value="Data" className="text-xs" />
                                    )}
                                </div>
                            }
                        >
                            <div className="flex justify-content-between align-items-center mb-2">
                                <span className="text-xs font-semibold text-600">클라이언트 전송 본문 (Body):</span>
                                <Button
                                    label="복사"
                                    icon="pi pi-copy"
                                    size="small"
                                    text
                                    onClick={() =>
                                        copyToClipboard(stringifyJson(selectedLog.requestBody), 'Request Body 복사')
                                    }
                                />
                            </div>
                            <pre
                                className="p-3 border-round surface-100 font-mono text-xs overflow-auto select-all"
                                style={{ maxHeight: '450px', lineHeight: '1.5' }}
                            >
                                {stringifyJson(selectedLog.requestBody) || '전송된 Request Body가 없습니다.'}
                            </pre>
                        </TabPanel>

                        {/* 탭 2: Response Body */}
                        <TabPanel
                            header={
                                <div className="flex align-items-center gap-2">
                                    <i className="pi pi-download" />
                                    <span>Response Body</span>
                                    <Tag
                                        severity={selectedLog.status >= 400 ? 'danger' : 'info'}
                                        value={String(selectedLog.status)}
                                        className="text-xs"
                                    />
                                </div>
                            }
                        >
                            <div className="flex justify-content-between align-items-center mb-2">
                                <span className="text-xs font-semibold text-600">
                                    서버 반환 본문 (Status: {selectedLog.status}):
                                </span>
                                <Button
                                    label="복사"
                                    icon="pi pi-copy"
                                    size="small"
                                    text
                                    onClick={() =>
                                        copyToClipboard(stringifyJson(selectedLog.responseBody), 'Response Body 복사')
                                    }
                                />
                            </div>
                            <pre
                                className="p-3 border-round surface-100 font-mono text-xs overflow-auto select-all"
                                style={{
                                    maxHeight: '450px',
                                    lineHeight: '1.5',
                                    borderColor: selectedLog.status >= 400 ? '#ef4444' : undefined
                                }}
                            >
                                {stringifyJson(selectedLog.responseBody) || '반환된 Response Body가 없습니다.'}
                            </pre>
                        </TabPanel>

                        {/* 탭 3: Query Parameters */}
                        <TabPanel
                            header={
                                <div className="flex align-items-center gap-2">
                                    <i className="pi pi-link" />
                                    <span>Query Parameters</span>
                                </div>
                            }
                        >
                            <div className="flex justify-content-between align-items-center mb-2">
                                <span className="text-xs font-semibold text-600">URL 쿼리스트링 파라미터:</span>
                                <Button
                                    label="복사"
                                    icon="pi pi-copy"
                                    size="small"
                                    text
                                    onClick={() =>
                                        copyToClipboard(stringifyJson(selectedLog.queryParams), 'Query 복사')
                                    }
                                />
                            </div>
                            <pre
                                className="p-3 border-round surface-100 font-mono text-xs overflow-auto select-all"
                                style={{ maxHeight: '450px', lineHeight: '1.5' }}
                            >
                                {stringifyJson(selectedLog.queryParams) || 'Query Parameters가 없습니다.'}
                            </pre>
                        </TabPanel>

                        {/* 탭 4: 메타데이터 & 헤더 */}
                        <TabPanel
                            header={
                                <div className="flex align-items-center gap-2">
                                    <i className="pi pi-info-circle" />
                                    <span>상세 메타데이터 & Headers</span>
                                </div>
                            }
                        >
                            <div className="grid text-sm">
                                <div className="col-12 md:col-6">
                                    <div className="surface-50 p-3 border-round border-1 surface-border flex flex-column gap-2">
                                        <div>
                                            <strong className="text-700">호출 일시:</strong>{' '}
                                            <span>{formatDate(selectedLog.createdDate)}</span>
                                        </div>
                                        <div>
                                            <strong className="text-700">소요 시간:</strong>{' '}
                                            <span className="font-bold text-primary">
                                                {selectedLog.durationMs ? `${selectedLog.durationMs} ms` : '-'}
                                            </span>
                                        </div>
                                        <div>
                                            <strong className="text-700">클라이언트 IP:</strong>{' '}
                                            <span className="font-mono">{selectedLog.ip}</span>
                                        </div>
                                        <div>
                                            <strong className="text-700">호스트(Host):</strong>{' '}
                                            <span>{selectedLog.hostname}</span>
                                        </div>
                                        <div>
                                            <strong className="text-700">사용자명:</strong>{' '}
                                            <span className="font-bold">{selectedLog.userName || '비로그인'}</span>
                                        </div>
                                        <div>
                                            <strong className="text-700">사용자 ID:</strong>{' '}
                                            <span className="font-mono">{selectedLog.userId || '-'}</span>
                                        </div>
                                        <div>
                                            <strong className="text-700">인증 유형(AuthType):</strong>{' '}
                                            <Tag value={selectedLog.authType || 'NONE'} severity="info" />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-12 md:col-6">
                                    <div className="surface-50 p-3 border-round border-1 surface-border flex flex-column gap-2">
                                        <div className="font-bold text-700 mb-1">Request Headers:</div>
                                        <pre
                                            className="m-0 p-2 surface-100 border-round font-mono text-xs overflow-auto"
                                            style={{ maxHeight: '180px' }}
                                        >
                                            {stringifyJson(selectedLog.headers) || '헤더 정보가 없습니다.'}
                                        </pre>
                                        <div className="text-xs text-500 mt-2">
                                            <strong className="text-700">User-Agent:</strong>
                                            <p className="m-0 mt-1 word-break-all font-mono">{selectedLog.userAgent}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabPanel>
                    </TabView>
                )}
            </Dialog>
        </div>
    );
};

export default SystemLogPage;
