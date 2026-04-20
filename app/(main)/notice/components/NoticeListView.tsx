import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
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
    loading: boolean;
    selectedNotices: Notice[];
    setSelectedNotices: (notices: Notice[]) => void;
    onWrite: () => void;
    onDelete: () => void;
    onRowClick: (noticeId: string) => void;
}

const NoticeListView: React.FC<NoticeListViewProps> = ({
    notices,
    loading,
    selectedNotices,
    setSelectedNotices,
    onWrite,
    onDelete,
    onRowClick
}) => {
    const [globalFilter, setGlobalFilter] = useState<string>('');

    const titleTemplate = (rowData: Notice) => {
        return (
            <div className="flex align-items-center gap-2">
                {rowData.isNotice && <span className="p-tag p-tag-danger">공지</span>}
                <span
                    className="font-semibold cursor-pointer hover:text-primary"
                    onClick={() => onRowClick(rowData.noticeId)}
                >
                    {rowData.title}
                </span>
            </div>
        );
    };

    const dateTemplate = (rowData: Notice) => {
        return dayjs(rowData.createdDate).format('YYYY-MM-DD HH:mm');
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
                selectionMode="multiple"
                dataKey="noticeId"
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25]}
                className="p-datatable-sm"
                loading={loading}
                emptyMessage="등록된 공지사항이 없습니다."
                globalFilter={globalFilter}
                globalFilterFields={['title']}
                header={header}
            >
                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
                <Column field="title" header="제목" body={titleTemplate} style={{ minWidth: '300px' }}></Column>
                <Column field="createdUser" header="작성자" style={{ minWidth: '100px' }}></Column>
                <Column header="작성일" body={dateTemplate} style={{ minWidth: '150px' }}></Column>
            </DataTable>
        </div>
    );
};

export default NoticeListView;
