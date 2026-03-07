'use client';

import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { ShareItem } from '../types';
import dayjs from 'dayjs';

interface ListViewProps {
    shares: ShareItem[];
    onRowSelect: (id: string) => void;
    onNewPost: () => void;
    onShare: (item: ShareItem, type: 'student' | 'parent') => void;
    onDelete: (id: string) => void;
    onDeleteMultiple: (selectedItems: ShareItem[]) => void;
}

const ListView = ({ shares, onRowSelect, onNewPost, onShare, onDelete, onDeleteMultiple }: ListViewProps) => {
    const [selectedItems, setSelectedItems] = React.useState<ShareItem[]>([]);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return dayjs(date).format('YYYY-MM-DD HH:mm');
    };

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
                <h5>공유 게시판 목록</h5>
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
                </div>
            </div>
            <DataTable
                value={shares}
                selectionMode="checkbox"
                selection={selectedItems}
                onSelectionChange={(e) => setSelectedItems(e.value as ShareItem[])}
                emptyMessage="등록된 게시글이 없습니다."
                dataKey="_id"
                responsiveLayout="scroll"
            >
                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
                <Column 
                    field="actualTitle" 
                    header="게시글 제목" 
                    body={titleBodyTemplate}
                    sortable 
                />
                <Column field="studentName" header="공유 대상" sortable />
                <Column field="telNo" header="학생 연락처" sortable />
                <Column field="pTelNo" header="학부모 연락처" sortable />
                <Column field="shareTitle" header="공유 제목 (카카오)" sortable />
                <Column
                    field="createdDate"
                    header="등록일"
                    body={(rowData) => formatDate(rowData.createdDate)}
                    sortable
                />
                <Column
                    header="공유 (학생/학부모)"
                    body={shareBodyTemplate}
                />
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
