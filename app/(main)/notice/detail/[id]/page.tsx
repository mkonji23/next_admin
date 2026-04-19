'use client';

import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { useRouter, useParams } from 'next/navigation';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import useAuthStore from '@/store/useAuthStore';
import { CustomEditor } from '@/components/editor/CustomEditor';
import dayjs from 'dayjs';
import { confirmDialog } from 'primereact/confirmdialog';

interface NoticeDetail {
    noticeId: string;
    title: string;
    content: string;
    delta: any;
    createdUser: string;
    isNotice: boolean;
    createdDate: string;
}

const NoticeDetailPage = () => {
    const [notice, setNotice] = useState<NoticeDetail | null>(null);
    const [loading, setLoading] = useState(true);
    
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    
    const http = useHttp();
    const { showToast } = useToast();
    const { userInfo } = useAuthStore();

    useEffect(() => {
        if (id) {
            fetchNoticeDetail();
        }
    }, [id]);

    const fetchNoticeDetail = async () => {
        setLoading(true);
        try {
            const response = await http.get(`/choiMath/notice/detail/${id}`);
            setNotice(response.data);
        } catch (error) {
            console.error('Fetch notice detail error:', error);
            showToast({ severity: 'error', summary: '조회 실패', detail: '공지사항을 불러오지 못했습니다.' });
            router.push('/notice');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        confirmDialog({
            message: '이 공지사항을 삭제하시겠습니까?',
            header: '삭제 확인',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: '예',
            rejectLabel: '아니오',
            accept: async () => {
                try {
                    await http.post('/choiMath/notice/delete', { ids: [id] });
                    showToast({ severity: 'success', summary: '삭제 완료', detail: '공지사항이 삭제되었습니다.' });
                    router.push('/notice');
                } catch (error) {
                    console.error('Delete error:', error);
                    showToast({ severity: 'error', summary: '삭제 실패', detail: '삭제 중 오류가 발생했습니다.' });
                }
            }
        });
    };

    if (loading) {
        return <div className="flex justify-content-center p-5"><i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i></div>;
    }

    if (!notice) {
        return <div className="p-5 text-center">존재하지 않거나 삭제된 공지사항입니다.</div>;
    }

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-4 border-bottom-1 surface-border pb-3">
                        <div className="flex flex-column gap-2">
                            <div className="flex align-items-center gap-2">
                                {notice.isNotice && <span className="p-tag p-tag-danger">공지</span>}
                                <h4 className="m-0">{notice.title}</h4>
                            </div>
                            <span className="text-500 text-sm">
                                작성자: {notice.createdUser} | 작성일: {dayjs(notice.createdDate).format('YYYY-MM-DD HH:mm:ss')}
                            </span>
                        </div>
                        <div className="flex gap-2 mt-3 md:mt-0">
                            <Button label="목록" icon="pi pi-list" className="p-button-secondary p-button-outlined" onClick={() => router.push('/notice')} />
                            {/* 작성자이거나 관리자일 경우만 표시되도록 조절 가능 */}
                            <Button label="수정" icon="pi pi-pencil" className="p-button-outlined" onClick={() => router.push(`/notice/edit/${id}`)} />
                            <Button label="삭제" icon="pi pi-trash" className="p-button-danger p-button-outlined" onClick={handleDelete} />
                        </div>
                    </div>

                    <div className="mt-4">
                        <CustomEditor 
                            delta={notice.delta} 
                            readOnly={true} 
                            style={{ minHeight: '300px', border: 'none' }} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NoticeDetailPage;
