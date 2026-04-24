'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import dayjs from 'dayjs';
import { confirmDialog } from 'primereact/confirmdialog';
import NoticeWriteView from '../components/NoticeWriteView';
import NoticeDetailView from '../components/NoticeDetailView';
import NoticeEditView from '../components/NoticeEditView';
import NoticeListView from '../components/NoticeListView';

interface Notice {
    noticeId: string;
    title: string;
    createdUser: string;
    isNotice: boolean;
    createdDate: string;
    content?: string;
    delta?: any;
    imageUrls?: any[];
    targetClassIds?: string[];
    targetClassNames?: string[];
}

const NoticePage = ({ path }: { path?: string }) => {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [selectedNotices, setSelectedNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(false);

    const [currentView, setCurrentView] = useState<'list' | 'write' | 'detail' | 'edit'>('list');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detailNotice, setDetailNotice] = useState<Notice | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const http = useHttp();
    const { showToast } = useToast();

    // Determine if we are in a dedicated detail tab via URL
    const isDedicatedDetailTab = useMemo(() => {
        return path && path.startsWith('/notice/') && !path.endsWith('/write') && path !== '/notice';
    }, [path]);

    useEffect(() => {
        // Initial data fetch for list view
        fetchNotices();

        // Handle direct URL access
        if (isDedicatedDetailTab) {
            const id = path?.split('/')[2];
            if (id) {
                setSelectedId(id);
                setCurrentView('detail');
                fetchDetail(id);
            }
        }
    }, [path, isDedicatedDetailTab]);

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

    const fetchDetail = async (id: string) => {
        setDetailLoading(true);
        try {
            const response = await http.get('/choiMath/notice/list', {
                params: { noticeId: id },
                disableLoading: true
            });
            const data = response.data?.find((n: any) => n.noticeId === id);
            setDetailNotice(data || null);
        } catch (error) {
            console.error('Fetch detail error:', error);
        } finally {
            setDetailLoading(false);
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

    // Use detailNotice if fetched directly, otherwise find in the list
    const selectedNotice = detailNotice || notices.find((n) => n.noticeId === selectedId);

    return (
        <div className="grid">
            <div className="col-12">
                {currentView === 'list' && (
                    <NoticeListView
                        notices={notices}
                        loading={loading}
                        selectedNotices={selectedNotices}
                        setSelectedNotices={setSelectedNotices}
                        onWrite={() => setCurrentView('write')}
                        onDelete={handleDelete}
                        onRowClick={(id) => {
                            setSelectedId(id);
                            setCurrentView('detail');
                        }}
                        onNoticeSuccess={fetchNotices}
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

                {currentView === 'detail' && detailLoading && (
                    <div className="card flex justify-content-center align-items-center p-5">
                        <i className="pi pi-spin pi-spinner text-primary text-4xl"></i>
                    </div>
                )}

                {currentView === 'detail' && !detailLoading && selectedNotice && (
                    <NoticeDetailView
                        initialData={selectedNotice}
                        onBack={() => setCurrentView('list')}
                        onEdit={() => setCurrentView('edit')}
                        onDeleteSuccess={() => {
                            setCurrentView('list');
                            fetchNotices();
                        }}
                        onNoticeSuccess={() => {
                            if (selectedId) fetchDetail(selectedId);
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
                            if (selectedId) fetchDetail(selectedId);
                            fetchNotices();
                        }}
                    />
                )}

                {currentView === 'detail' && !detailLoading && !selectedNotice && (
                    <div className="card p-5 text-center">존재하지 않거나 삭제된 공지사항입니다.</div>
                )}
            </div>
        </div>
    );
};

export default NoticePage;
