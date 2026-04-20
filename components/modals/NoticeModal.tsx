'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { CustomEditor } from '../editor/CustomEditor';
import dayjs from 'dayjs';

interface NoticeModalProps {
    visible: boolean;
    onClose: (result?: any) => void;
    pData?: {
        notices: any[];
        initialNoticeId?: string;
    };
}

const NoticeModal = ({ visible, onClose, pData }: NoticeModalProps) => {
    const [selectedNotice, setSelectedNotice] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

    useEffect(() => {
        if (visible) {
            if (pData?.initialNoticeId) {
                const notice = pData.notices.find((n) => n.noticeId === pData.initialNoticeId);
                if (notice) {
                    setSelectedNotice(notice);
                    setViewMode('detail');
                    return;
                }
            }
            setViewMode('list');
            setSelectedNotice(null);
        }
    }, [visible, pData]);

    const handleNoticeClick = (notice: any) => {
        setSelectedNotice(notice);
        setViewMode('detail');
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedNotice(null);
    };

    const handleClose = () => {
        if (viewMode === 'detail' && pData?.initialNoticeId) {
            // If it was an auto-popup, mark as read
            localStorage.setItem(`notice_read_${selectedNotice.noticeId}`, 'true');
        }
        onClose();
    };

    const titleTemplate = (rowData: any) => {
        return (
            <div className="flex align-items-center gap-2">
                {rowData.isNotice && <span className="p-tag p-tag-success">공지</span>}
                <span className="font-semibold">{rowData.title}</span>
            </div>
        );
    };

    const dateTemplate = (rowData: any) => {
        return dayjs(rowData.createdDate).format('YYYY-MM-DD');
    };

    const renderList = () => (
        <DataTable
            value={pData?.notices || []}
            rows={10}
            className="p-datatable-sm"
            onRowClick={(e) => handleNoticeClick(e.data)}
            rowClassName={() => 'cursor-pointer'}
            emptyMessage="공지사항이 없습니다."
        >
            <Column field="title" header="제목" body={titleTemplate} />
            <Column field="createdDate" header="작성일" body={dateTemplate} style={{ width: '120px' }} />
        </DataTable>
    );

    const renderDetail = () => (
        <div className="flex flex-column gap-3">
            <div className="flex justify-content-between align-items-center border-bottom-1 surface-border pb-2">
                <h5 className="m-0">{selectedNotice?.title}</h5>
                <span className="text-500 text-sm">
                    {dayjs(selectedNotice?.createdDate).format('YYYY-MM-DD HH:mm')}
                </span>
            </div>
            <div className="overflow-auto" style={{ maxHeight: '400px' }}>
                <CustomEditor delta={selectedNotice?.delta} readOnly={true} style={{ border: 'none' }} />
            </div>
            {!pData?.initialNoticeId && (
                <div className="flex justify-content-end mt-2">
                    <Button label="목록으로" icon="pi pi-list" className="p-button-text" onClick={handleBackToList} />
                </div>
            )}
            {pData?.initialNoticeId && (
                <div className="flex justify-content-end mt-2">
                    <Button
                        label="다시 보지 않기"
                        icon="pi pi-check"
                        className="p-button-outlined p-button-sm"
                        onClick={handleClose}
                    />
                </div>
            )}
        </div>
    );

    return (
        <Dialog
            header={viewMode === 'list' ? '공지사항 목록' : '공지사항'}
            visible={visible}
            style={{
                width: viewMode === 'list' ? '60vw' : '80vw',
                maxWidth: viewMode === 'list' ? '600px' : '1000px'
            }}
            onHide={handleClose}
            dismissableMask
        >
            {viewMode === 'list' ? renderList() : renderDetail()}
        </Dialog>
    );
};

export default NoticeModal;
