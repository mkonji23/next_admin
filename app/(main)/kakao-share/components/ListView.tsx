'use client';

import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { FilterMatchMode } from 'primereact/api';
import { useToast } from '@/hooks/useToast';
import { ShareItem } from '../types';
import dayjs from 'dayjs';

interface ListViewProps {
    shares: ShareItem[];
    onRowSelect: (id: string) => void;
    onNewPost: () => void;
    onShare: (item: ShareItem) => void;
    onSearch: () => void;
    onDelete: (id: string) => void;
    onDeleteMultiple: (selectedItems: ShareItem[]) => void;
    onCopyToNew: (item: ShareItem) => void;
    filters: any;
    setFilters: (filters: any) => void;
    globalFilterValue: string;
    setGlobalFilterValue: (value: string) => void;
    first: number;
    setFirst: (first: number) => void;
    selectedItems: ShareItem[];
    setSelectedItems: (items: ShareItem[]) => void;
}

const ListView = ({
    shares,
    onRowSelect,
    onNewPost,
    onShare,
    onDelete,
    onDeleteMultiple,
    onSearch,
    onCopyToNew,
    filters,
    setFilters,
    globalFilterValue,
    setGlobalFilterValue,
    first,
    setFirst,
    selectedItems,
    setSelectedItems
}: ListViewProps) => {
    const { showToast } = useToast();

    const initFilters = () => {
        return {
            global: { value: null, matchMode: FilterMatchMode.CONTAINS }
        };
    };

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

    const copyLink = (item: ShareItem, type: 'student' | 'parent' = 'student') => {
        const baseUri = typeof window !== 'undefined' ? window.location.origin : '';
        const shareLink = `${baseUri}/kakao-share/view/${type}/${item._id}`;

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
                className="truncate-cell-300 text-primary font-bold cursor-pointer hover:underline"
                onClick={(e) => {
                    e.stopPropagation();
                    onRowSelect(rowData._id || '');
                }}
            >
                {rowData.shareTitle}
            </span>
        );
    };

    const statusBodyTemplate = (rowData: ShareItem) => {
        const hasShared = rowData.shareStatus === '공유완료';
        return (
            <div className="flex align-items-center gap-2">
                <Tag value={rowData.shareStatus} severity={hasShared ? 'success' : null} style={{ minWidth: '60px' }} />
                <span className="text-sm text-500">({rowData.shareCount || 0}회)</span>
            </div>
        );
    };

    const openStatusBodyTemplate = (rowData: ShareItem) => {
        const shareCount = rowData.shareCount || 0;
        const openCount = rowData.kakaoOpenCount || 0;

        let status = { label: '미열람', severity: 'danger' };

        if (shareCount > 0) {
            if (openCount >= shareCount) {
                status = { label: '열람', severity: 'success' };
            } else if (openCount > 0) {
                status = { label: '부분 열람', severity: 'warning' };
            }
        } else if (openCount > 0) {
            // 공유 횟수는 0인데 열람이 있는 경우 (링크 직접 전달 등)
            status = { label: '열람', severity: 'success' };
        }

        return (
            <div className="flex align-items-center gap-2">
                <Tag value={status.label} severity={status.severity as any} style={{ minWidth: '80px' }} />
                <span className="text-sm text-500">
                    ({openCount}/{shareCount})
                </span>
            </div>
        );
    };

    const visitCountBodyTemplate = (rowData: ShareItem) => {
        return (
            <div className="flex align-items-center gap-2">
                <i className="pi pi-eye text-500" />
                <span>{rowData.totalOpenCount || 0}회</span>
            </div>
        );
    };

    const shareBodyTemplate = (rowData: ShareItem) => {
        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-copy"
                    className="p-button-rounded p-button-warning p-button-text"
                    tooltip="링크 복사(학생용)"
                    tooltipOptions={{ position: 'bottom' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        copyLink(rowData, 'student');
                    }}
                />
                <Button
                    icon="pi pi-copy"
                    className="p-button-rounded p-button-success p-button-text"
                    tooltip="링크 복사(학부모용)"
                    tooltipOptions={{ position: 'bottom' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        copyLink(rowData, 'parent');
                    }}
                />
                <Button
                    icon="pi pi-share-alt"
                    className="p-button-rounded p-button-primary p-button-text"
                    tooltip="카카오톡 공유"
                    tooltipOptions={{ position: 'bottom' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onShare(rowData);
                    }}
                />
            </div>
        );
    };

    const actionBodyTemplate = (rowData: ShareItem) => {
        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-clone"
                    className="p-button-rounded p-button-secondary p-button-text"
                    tooltip="복사하여 새로 만들기"
                    tooltipOptions={{ position: 'bottom' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onCopyToNew(rowData);
                    }}
                />
                <Button
                    icon="pi pi-trash"
                    className="p-button-rounded p-button-danger p-button-text"
                    tooltip="삭제"
                    tooltipOptions={{ position: 'bottom' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(rowData._id);
                    }}
                />
            </div>
        );
    };

    return (
        <div className="card">
            <div className="flex justify-content-between align-items-center mb-4">
                <div className="flex gap-2">
                    <Button severity="success" label="글쓰기" icon="pi pi-pencil" onClick={onNewPost} />
                    <Button
                        label={'복사'}
                        icon="pi pi-copy"
                        className="p-button-info p-button-outlined"
                        onClick={() => {
                            if (selectedItems.length !== 1) return;
                            onCopyToNew(selectedItems[0]);
                        }}
                        disabled={selectedItems.length !== 1}
                    />

                    <Button
                        label={selectedItems.length > 0 ? `삭제 (${selectedItems.length})` : '삭제'}
                        icon="pi pi-trash"
                        className="p-button-danger p-button-outlined"
                        onClick={() => {
                            if (selectedItems.length === 0) return;
                            onDeleteMultiple(selectedItems);
                        }}
                        disabled={selectedItems.length === 0}
                    />
                    <Button label="조회" icon="pi pi-search" onClick={onSearch} />
                </div>
            </div>
            <DataTable
                showGridlines
                value={shares}
                selectionMode="checkbox"
                selection={selectedItems}
                onSelectionChange={(e) => {
                    setSelectedItems(e.value as ShareItem[]);
                }}
                emptyMessage="검색 결과가 없습니다."
                dataKey="_id"
                filters={filters}
                globalFilterFields={['shareTitle', 'actualTitle', 'studentName', 'telNo', 'pTelNo', 'shareStatus']}
                header={header}
                rows={10}
                paginator
                first={first}
                onPage={(e) => setFirst(e.first)}
            >
                <Column
                    header="No."
                    body={(data, options) => options.rowIndex + 1}
                    style={{ width: '1rem' }}
                    align={'right'}
                />
                <Column selectionMode="multiple" headerStyle={{ width: '1rem' }}></Column>
                <Column field="shareTitle" header="공유 제목 (카카오)" body={titleBodyTemplate} sortable />
                {/* <Column field="actualTitle" header="게시글 제목" sortable /> */}
                <Column field="studentName" header="학생" headerStyle={{ minWidth: '100px' }} sortable />
                <Column field="className" header="클래스" headerStyle={{ minWidth: '120px' }} sortable />
                <Column field="telNo" header="학생 연락처" headerStyle={{ minWidth: '100px' }} sortable />
                <Column field="pTelNo" header="학부모 연락처" headerStyle={{ minWidth: '150px' }} sortable />
                <Column
                    field="shareCount"
                    headerTooltip="카카오공유하기로 공유되었는지 여부"
                    header="공유상태"
                    body={statusBodyTemplate}
                    sortable
                    headerStyle={{ minWidth: '150px' }}
                />
                <Column
                    field="kakaoOpenCount"
                    headerTooltip="공유된 링크를 사용자가 열람한 횟수"
                    header="열람상태"
                    body={openStatusBodyTemplate}
                    sortable
                    headerStyle={{ minWidth: '150px' }}
                />
                <Column
                    field="totalOpenCount"
                    headerTooltip="사용자가 페이지를 방문한 총 횟수"
                    header="방문횟수"
                    body={visitCountBodyTemplate}
                    sortable
                    headerStyle={{ minWidth: '120px' }}
                />

                <Column header="공유" body={shareBodyTemplate} />
                <Column header="작업" body={actionBodyTemplate} />
                <Column
                    field="createdDate"
                    header="등록일"
                    headerStyle={{ minWidth: '160px' }}
                    body={(rowData) => formatDate(rowData.createdDate)}
                    sortable
                />
                <Column
                    field="updatedDate"
                    header="수정일"
                    headerStyle={{ minWidth: '160px' }}
                    body={(rowData) => formatDate(rowData.updatedDate)}
                    sortable
                />
            </DataTable>
        </div>
    );
};

export default ListView;
