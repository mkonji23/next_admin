'use client';

import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import { useToast } from '@/hooks/useToast';
import { ShareItem } from '../types';
import dayjs from 'dayjs';

interface ListViewProps {
    shares: ShareItem[];
    onRowSelect: (id: string) => void;
    onNewPost: () => void;
    onShare: (item: ShareItem, type: 'student' | 'parent') => void;
    onSearch: () => void;
    onDelete: (id: string) => void;
    onDeleteMultiple: (selectedItems: ShareItem[]) => void;
}

const ListView = ({ shares, onRowSelect, onNewPost, onShare, onDelete, onDeleteMultiple, onSearch }: ListViewProps) => {
    const [selectedItems, setSelectedItems] = useState<ShareItem[]>([]);
    const { showToast } = useToast();

    const initFilters = () => {
        return {
            global: { value: null, matchMode: FilterMatchMode.CONTAINS }
        };
    };

    const [filters, setFilters] = useState(initFilters());
    const [globalFilterValue, setGlobalFilterValue] = useState('');

    const clearFilter = () => {
        setFilters(initFilters());
        setGlobalFilterValue('');
    };

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };
        (_filters['global'] as any).value = value;

        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const copyLink = (item: ShareItem) => {
        const baseUri = typeof window !== 'undefined' ? window.location.origin : '';
        const shareLink = `${baseUri}/kakao-share/view/student/${item._id}`;

        navigator.clipboard
            .writeText(shareLink)
            .then(() => {
                showToast({
                    severity: 'success',
                    summary: '복사 완료',
                    detail: '공유 링크가 클립보드에 복사되었습니다.'
                });
            })
            .catch((err) => {
                console.error('Copy error:', err);
                showToast({ severity: 'error', summary: '오류', detail: '링크 복사에 실패했습니다.' });
            });
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return dayjs(date).format('YYYY-MM-DD HH:mm');
    };

    const renderHeader = () => {
        return (
            <div className="flex flex-wrap gap-2 justify-content-between align-items-center">
                <h5 className="m-0">공유 게시판 목록</h5>
                <div className="flex flex-wrap gap-2 align-items-center">
                    <Button
                        type="button"
                        icon="pi pi-filter-slash"
                        label="초기화"
                        className="p-button-outlined"
                        onClick={clearFilter}
                    />
                    <span className="p-input-icon-left">
                        <i className="pi pi-search" />
                        <InputText
                            value={globalFilterValue}
                            onChange={onGlobalFilterChange}
                            placeholder="전체 내용 검색"
                        />
                    </span>
                </div>
            </div>
        );
    };

    const header = renderHeader();

    const titleBodyTemplate = (rowData: ShareItem) => {
        return (
            <span
                className="text-primary font-bold cursor-pointer hover:underline"
                onClick={(e) => {
                    e.stopPropagation();
                    onRowSelect(rowData._id);
                }}
            >
                {rowData.actualTitle}
            </span>
        );
    };

    const shareBodyTemplate = (rowData: ShareItem) => {
        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-copy"
                    className="p-button-rounded p-button-info p-button-text"
                    tooltip="링크 복사"
                    tooltipOptions={{ position: 'bottom' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        copyLink(rowData);
                    }}
                />
                <Button
                    icon="pi pi-user"
                    className="p-button-rounded p-button-warning p-button-text"
                    tooltip="학생용 공유"
                    tooltipOptions={{ position: 'bottom' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onShare(rowData, 'student');
                    }}
                />
                <Button
                    icon="pi pi-users"
                    className="p-button-rounded p-button-success p-button-text"
                    tooltip="학부모용 공유"
                    tooltipOptions={{ position: 'bottom' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onShare(rowData, 'parent');
                    }}
                />
            </div>
        );
    };

    return (
        <div className="card">
            <div className="flex justify-content-between align-items-center mb-4">
                <div className="flex gap-2">
                    <Button
                        label={selectedItems.length > 0 ? `선택 삭제 (${selectedItems.length})` : '선택 삭제'}
                        icon="pi pi-trash"
                        className="p-button-danger p-button-outlined"
                        onClick={() => {
                            if (selectedItems.length === 0) return;
                            onDeleteMultiple(selectedItems);
                            setSelectedItems([]);
                        }}
                        disabled={selectedItems.length === 0}
                    />
                    <Button label="글쓰기" icon="pi pi-pencil" onClick={onNewPost} />
                    <Button label="조회" icon="pi pi-search" onClick={onSearch} />
                </div>
            </div>
            <DataTable
                value={shares}
                selectionMode="checkbox"
                selection={selectedItems}
                onSelectionChange={(e) => setSelectedItems(e.value as ShareItem[])}
                emptyMessage="검색 결과가 없습니다."
                dataKey="_id"
                responsiveLayout="scroll"
                filters={filters}
                globalFilterFields={['shareTitle', 'actualTitle', 'studentName', 'telNo', 'pTelNo']}
                header={header}
                rows={10}
                paginator
            >
                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
                <Column field="shareTitle" header="공유 제목 (카카오)" body={titleBodyTemplate} sortable />
                <Column field="actualTitle" header="게시글 제목" sortable />
                <Column field="studentName" header="공유 대상" sortable />
                <Column field="telNo" header="학생 연락처" sortable />
                <Column field="pTelNo" header="학부모 연락처" sortable />

                <Column
                    field="createdDate"
                    header="등록일"
                    body={(rowData) => formatDate(rowData.createdDate)}
                    sortable
                />
                <Column header="공유 (학생/학부모)" body={shareBodyTemplate} />
                <Column
                    header="삭제"
                    body={(rowData: ShareItem) => (
                        <Button
                            icon="pi pi-trash"
                            className="p-button-rounded p-button-danger p-button-text"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(rowData._id);
                            }}
                        />
                    )}
                />
            </DataTable>
        </div>
    );
};

export default ListView;
