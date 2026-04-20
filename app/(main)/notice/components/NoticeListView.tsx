import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import dayjs from 'dayjs';

interface Notice {
    noticeId: string;
    title: string;
    createdUser: string;
    isNotice: boolean;
    createdDate: string;
    content?: string;
    delta?: any;
    imageUrls?: any[];
}

interface NoticeListViewProps {
    notices: Notice[];
    loading?: boolean;
    selectedNotices: Notice[];
    setSelectedNotices: (notices: Notice[]) => void;
    onWrite: () => void;
    onDelete: () => void;
    onRowClick: (noticeId: string) => void;
    onNoticeSuccess: () => void;
}

const NoticeListView: React.FC<NoticeListViewProps> = ({
    notices,
    loading = false,
    selectedNotices,
    setSelectedNotices,
    onWrite,
    onDelete,
    onRowClick,
    onNoticeSuccess
}) => {
    const [globalFilter, setGlobalFilter] = useState<string>('');
    const http = useHttp();
    const { showToast } = useToast();

    const titleTemplate = (rowData: Notice) => {
        return (
            <div className="flex align-items-center gap-2" style={{ minWidth: '300px' }}>
                {rowData.isNotice ? (
                    <span className="p-tag p-tag-success">
                        <i className="pi pi-bell mr-1" />
                        공지
                    </span>
                ) : (
                    <span className="p-tag p-tag-danger">
                        <i className="pi pi-clock mr-1" />
                        미공지
                    </span>
                )}
                <span className="font-semibold">{rowData.title}</span>
            </div>
        );
    };

    const dateTemplate = (rowData: Notice) => {
        return dayjs(rowData.createdDate).format('YYYY-MM-DD HH:mm');
    };

    const handleNotice = async (rowData: Notice) => {
        try {
            const res = await http.post(`/choiMath/notice/publishNotice/${rowData.noticeId}`);
            const isNotice = res.data?.notices?.isNotice;
            if (isNotice) {
                showToast({
                    severity: 'warn',
                    summary: '공지 해제',
                    detail: '공지 해제되었습니다.'
                });
            } else {
                showToast({
                    severity: 'success',
                    summary: '공지 설정',
                    detail: '공지되었습니다.'
                });
            }
            onNoticeSuccess && onNoticeSuccess();
        } catch (error) {
            console.error('SetNotice error:', error);
            showToast({ severity: 'error', summary: '공지 설정 실패', detail: '공지 설정 중 오류가 발생했습니다.' });
        }
    };

    const actionTemplate = (rowData: Notice) => {
        if (rowData.isNotice) {
            return (
                <Button
                    icon="pi pi-bell-slash"
                    label="공지해제"
                    className="p-button-sm p-button-warning p-button-outlined"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleNotice(rowData);
                    }}
                    tooltip="공지 해제"
                    tooltipOptions={{ position: 'top' }}
                />
            );
        }
        return (
            <Button
                icon="pi pi-bell"
                label="공지하기"
                className="p-button-sm p-button-success p-button-outlined"
                onClick={(e) => {
                    e.stopPropagation();
                    handleNotice(rowData);
                }}
                tooltip="공지로 설정"
                tooltipOptions={{ position: 'top' }}
            />
        );
    };

    const header = (
        <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-4 gap-3">
            <div className="flex gap-2">
                <Button label="글쓰기" icon="pi pi-pencil" className="p-button-primary" onClick={onWrite} />
                <Button
                    label="선택 삭제"
                    icon="pi pi-trash"
                    className="p-button-danger p-button-outlined"
                    onClick={onDelete}
                    disabled={!selectedNotices || selectedNotices.length === 0}
                />
            </div>
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText
                    type="search"
                    onInput={(e) => setGlobalFilter(e.currentTarget.value)}
                    placeholder="제목 검색..."
                />
            </span>
        </div>
    );

    return (
        <div className="card">
            <DataTable
                value={notices}
                selection={selectedNotices}
                onSelectionChange={(e) => setSelectedNotices(e.value as Notice[])}
                selectionMode="checkbox"
                dataKey="noticeId"
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25]}
                className="p-datatable-sm"
                emptyMessage="등록된 공지사항이 없습니다."
                globalFilter={globalFilter}
                globalFilterFields={['title']}
                header={header}
                onRowClick={(e) => onRowClick((e.data as Notice).noticeId)}
                rowClassName={() => 'cursor-pointer'}
            >
                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
                <Column
                    field="title"
                    header="제목"
                    body={titleTemplate}
                    headerStyle={{ minWidth: '300px' }}
                    sortable
                ></Column>
                <Column field="createdUser" header="작성자" style={{ minWidth: '100px' }} sortable></Column>
                <Column
                    field="createdDate"
                    header="작성일"
                    body={dateTemplate}
                    style={{ minWidth: '150px' }}
                    sortable
                ></Column>
                <Column header="공지" body={actionTemplate} style={{ width: '110px' }} align="center"></Column>
            </DataTable>
        </div>
    );
};

export default NoticeListView;
