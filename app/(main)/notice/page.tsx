'use client';

import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import dayjs from 'dayjs';
import { confirmDialog } from 'primereact/confirmdialog';
import NoticeWriteView from './components/NoticeWriteView';
import NoticeDetailView from './components/NoticeDetailView';
import NoticeEditView from './components/NoticeEditView';
import NoticeListView from './components/NoticeListView';

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

const NoticePage = () => {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [selectedNotices, setSelectedNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(false);

    const [currentView, setCurrentView] = useState<'list' | 'write' | 'detail' | 'edit'>('list');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const http = useHttp();
    const { showToast } = useToast();

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        setLoading(true);
        try {
            const response = await http.get('/choiMath/notice/list');
            setNotices(response.data || []);
        } catch (error) {
            console.error('Fetch notices error:', error);
            showToast({ severity: 'error', summary: '조회 실패', detail: '공지사항 목록을 불러오지 못했습니다.' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        if (!selectedNotices || selectedNotices.length === 0) return;

        confirmDialog({
            message: `선택한 ${selectedNotices.length}개의 공지사항을 삭제하시겠습니까?`,
            header: '삭제 확인',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: '예',
            rejectLabel: '아니오',
            accept: async () => {
                try {
                    const ids = selectedNotices.map((n) => n.noticeId);
                    await http.post('/choiMath/notice/delete', { ids });
                    showToast({ severity: 'success', summary: '삭제 완료', detail: '성공적으로 삭제되었습니다.' });
                    setSelectedNotices([]);
                    fetchNotices();
                } catch (error) {
                    console.error('Delete error:', error);
                    showToast({ severity: 'error', summary: '삭제 실패', detail: '삭제 처리 중 오류가 발생했습니다.' });
                }
            }
        });
    };

    const titleTemplate = (rowData: Notice) => {
        return (
            <div className="flex align-items-center gap-2">
                {rowData.isNotice && <span className="p-tag p-tag-danger">공지</span>}
                <span
                    className="font-semibold cursor-pointer hover:text-primary"
                    onClick={() => {
                        setSelectedId(rowData.noticeId);
                        setCurrentView('detail');
                    }}
                >
                    {rowData.title}
                </span>
            </div>
        );
    };

    const dateTemplate = (rowData: Notice) => {
        return dayjs(rowData.createdDate).format('YYYY-MM-DD HH:mm');
    };

    const selectedNotice = notices.find((n) => n.noticeId === selectedId);

    return (
        <div className="grid">
            <div className="col-12">
                {currentView === 'list' && (
                    <NoticeListView
                        notices={notices}
                        selectedNotices={selectedNotices}
                        setSelectedNotices={setSelectedNotices}
                        onWrite={() => setCurrentView('write')}
                        onDelete={handleDelete}
                        onRowClick={(id) => {
                            setSelectedId(id);
                            setCurrentView('detail');
                        }}
                    />
                )}

                {currentView === 'write' && (
                    <NoticeWriteView
                        onBack={() => setCurrentView('list')}
                        onSuccess={() => {
                            setCurrentView('list');
                            fetchNotices();
                        }}
                    />
                )}

                {currentView === 'detail' && selectedNotice && (
                    <NoticeDetailView
                        initialData={selectedNotice}
                        onBack={() => setCurrentView('list')}
                        onEdit={() => setCurrentView('edit')}
                        onDeleteSuccess={() => {
                            setCurrentView('list');
                            fetchNotices();
                        }}
                    />
                )}

                {currentView === 'edit' && selectedNotice && (
                    <NoticeEditView
                        initialData={selectedNotice}
                        onBack={() => setCurrentView('detail')}
                        onSuccess={() => {
                            setCurrentView('detail');
                            fetchNotices();
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default NoticePage;
