'use client';

import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Tooltip } from 'primereact/tooltip';
import { FilterMatchMode } from 'primereact/api';
import { useToast } from '@/hooks/useToast';
import { useCustomModal } from '@/hooks/useCustomModal';
import { ShareItem } from '../types';
import dayjs from 'dayjs';
import useAuthStore from '@/store/useAuthStore';

interface ListViewProps {
    shares: ShareItem[];
    onRowSelect: (id: string) => void;
    onNewPost: () => void;
    onTemplateApply: (template: any) => void;
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
    onTemplateApply,
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
    const { openModal } = useCustomModal();
    const { userInfo } = useAuthStore();

    const yearOptions = Array.from(new Set(shares.map((s) => s.autoYear).filter(Boolean)))
        .sort()
        .map((y) => ({ label: `${y}년`, value: y }));

    const monthOptions = Array.from(new Set(shares.map((s) => s.autoMonth).filter(Boolean)))
        .sort((a, b) => Number(a) - Number(b))
        .map((m) => ({ label: `${m}월`, value: m }));

    const weekOptions = Array.from(new Set(shares.map((s) => s.autoWeek).filter(Boolean)))
        .sort((a, b) => Number(a) - Number(b))
        .map((w) => ({ label: `${w}주차`, value: w }));

    const statusOptions = [
        { label: '공유완료', value: '공유완료' },
        { label: '미공유', value: '미공유' }
    ];

    const initFilters = () => {
        return {
            global: { value: null, matchMode: FilterMatchMode.CONTAINS },
            autoYear: { value: String(new Date().getFullYear()), matchMode: FilterMatchMode.EQUALS },
            autoMonth: { value: null, matchMode: FilterMatchMode.EQUALS },
            autoWeek: { value: null, matchMode: FilterMatchMode.EQUALS },
            shareStatus: { value: null, matchMode: FilterMatchMode.EQUALS }
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

    const onFilterChange = (field: string, value: any) => {
        let _filters = { ...filters };
        if (!_filters[field]) {
            _filters[field] = { value: null, matchMode: FilterMatchMode.EQUALS };
        }
        _filters[field].value = value;
        setFilters(_filters);
    };

    const copyLink = (item: ShareItem, type: 'student' | 'parent' | 'public' = 'student') => {
        const baseUri = typeof window !== 'undefined' ? window.location.origin : '';
        let shareLink = '';

        if (type === 'public') {
            shareLink = `${baseUri}/kakao-share/public-view/${item.publicUrl}`;
        } else {
            shareLink = `${baseUri}/kakao-share/view/${type}/${item._id}`;
        }

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

    const handleTemplateClick = async () => {
        const result = await openModal({ id: 'shareTemplate' });
        if (result) {
            onSearch();
        }
    };

    const handleDeleteTemplateClick = async () => {
        const result = await openModal({ id: 'deleteTemplate' });
        if (result) {
            // 삭제 성공 시 목록 갱신
            onSearch();
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return dayjs(date).format('YYYY-MM-DD HH:mm');
    };

    const renderHeader = () => {
        return (
            <div className="flex flex-column gap-3">
                <div className="flex flex-column md:flex-row gap-3 justify-content-between align-items-start md:align-items-center">
                    <h5 className="m-0">공유 게시판 목록</h5>
                    <div className="flex flex-wrap gap-2 align-items-center w-full md:w-auto">
                        <Dropdown
                            value={filters.autoYear?.value}
                            options={yearOptions}
                            onChange={(e) => onFilterChange('autoYear', e.value)}
                            placeholder="년도 선택"
                            showClear
                            className="w-full md:w-10rem"
                        />
                        <Dropdown
                            value={filters.autoMonth?.value}
                            options={monthOptions}
                            onChange={(e) => onFilterChange('autoMonth', e.value)}
                            placeholder="월 선택"
                            showClear
                            className="w-full md:w-8rem"
                        />
                        <Dropdown
                            value={filters.autoWeek?.value}
                            options={weekOptions}
                            onChange={(e) => onFilterChange('autoWeek', e.value)}
                            placeholder="주차 선택"
                            showClear
                            className="w-full md:w-10rem"
                        />
                        <Dropdown
                            value={filters.shareStatus?.value}
                            options={statusOptions}
                            onChange={(e) => onFilterChange('shareStatus', e.value)}
                            placeholder="공유 상태"
                            showClear
                            className="w-full md:w-10rem"
                        />
                        <span className="p-input-icon-left flex-1 md:flex-none">
                            <i className="pi pi-search" />
                            <InputText
                                className="w-full"
                                value={globalFilterValue}
                                onChange={onGlobalFilterChange}
                                placeholder="전체 내용 검색"
                            />
                        </span>
                        <Button
                            type="button"
                            icon="pi pi-filter-slash"
                            label="필터 초기화"
                            className="p-button-outlined white-space-nowrap"
                            onClick={clearFilter}
                        />
                    </div>
                </div>
            </div>
        );
    };

    const header = renderHeader();

    const titleBodyTemplate = (rowData: ShareItem) => {
        const isToday = dayjs(rowData.createdDate).isSame(dayjs(), 'day');
        const isAuto = rowData.isAuto === true;
        const rowId = rowData._id?.toString().replace(/\W/g, '') || Math.random().toString(36).substring(7);

        return (
            <div className="flex align-items-center gap-2">
                <div className="flex gap-1 flex-shrink-0">
                    {isToday && (
                        <>
                            <div
                                id={`new-tag-${rowId}`}
                                className="flex align-items-center justify-content-center border-circle bg-blue-500 text-white font-bold"
                                style={{ width: '18px', height: '18px', fontSize: '10px', cursor: 'help' }}
                            >
                                N
                            </div>
                            <Tooltip target={`#new-tag-${rowId}`} content="오늘 등록된 새 게시글" position="top" />
                        </>
                    )}
                    {isAuto && (
                        <>
                            <div
                                id={`auto-tag-${rowId}`}
                                className="flex align-items-center justify-content-center border-circle bg-orange-500 text-white font-bold"
                                style={{ width: '18px', height: '18px', fontSize: '10px', cursor: 'help' }}
                            >
                                A
                            </div>
                            <Tooltip target={`#auto-tag-${rowId}`} content="자동 생성 데이터" position="top" />
                        </>
                    )}
                </div>
                <span
                    className="truncate-cell-300 text-primary font-bold cursor-pointer hover:underline"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRowSelect(rowData._id || '');
                    }}
                >
                    {rowData.shareTitle}
                </span>
            </div>
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
                    icon="pi pi-link"
                    className="p-button-rounded p-button-info p-button-text"
                    tooltip="일반 링크 복사"
                    tooltipOptions={{ position: 'bottom' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        copyLink(rowData, 'public');
                    }}
                />
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
                        if (rowData._id) {
                            onDelete(rowData._id);
                        }
                    }}
                />
            </div>
        );
    };

    return (
        <div className="card">
            <div className="flex flex-column gap-3 mb-4">
                <div className="flex gap-2 overflow-x-auto pb-1">
                    <Button
                        severity="success"
                        label="글쓰기"
                        icon="pi pi-pencil"
                        className="white-space-nowrap flex-1 sm:flex-none"
                        onClick={onNewPost}
                    />
                    <Button
                        label="복사"
                        icon="pi pi-copy"
                        className="p-button-info p-button-outlined white-space-nowrap flex-1 sm:flex-none"
                        onClick={() => {
                            if (selectedItems.length !== 1) return;
                            onCopyToNew(selectedItems[0]);
                        }}
                        disabled={selectedItems.length !== 1}
                    />
                    <Button
                        label={selectedItems.length > 0 ? `삭제 (${selectedItems.length})` : '삭제'}
                        icon="pi pi-trash"
                        className="p-button-danger p-button-outlined white-space-nowrap flex-1 sm:flex-none"
                        onClick={() => {
                            if (selectedItems.length === 0) return;
                            onDeleteMultiple(selectedItems);
                        }}
                        disabled={selectedItems.length === 0}
                    />
                    <Button
                        label="조회"
                        icon="pi pi-search"
                        className="white-space-nowrap flex-1 sm:flex-none"
                        onClick={onSearch}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    <Button
                        severity="info"
                        tooltipOptions={{ position: 'bottom' }}
                        tooltip={userInfo.auth === 'admin' ? '최하죵화이팅💘' : (null as any)}
                        label="자동 템플릿 생성"
                        icon="pi pi-clone"
                        className="white-space-nowrap flex-1 sm:flex-none"
                        onClick={handleTemplateClick}
                    />
                    <Button
                        severity="danger"
                        label="자동 템플릿 삭제"
                        tooltipOptions={{ position: 'bottom' }}
                        tooltip={userInfo.auth === 'admin' ? '최하죵화이팅💘💘' : (null as any)}
                        icon="pi pi-trash"
                        className="white-space-nowrap flex-1 sm:flex-none"
                        onClick={handleDeleteTemplateClick}
                    />
                </div>
            </div>
            <DataTable
                scrollable
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
