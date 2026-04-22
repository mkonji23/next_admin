import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
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
    classIds?: string[];
}

interface NoticeDetailViewProps {
    initialData: any;
    onBack: () => void;
    onEdit: () => void;
    onDeleteSuccess: () => void;
    onNoticeSuccess: () => void;
}

const NoticeDetailView: React.FC<NoticeDetailViewProps> = ({
    initialData,
    onBack,
    onEdit,
    onDeleteSuccess,
    onNoticeSuccess
}) => {
    const http = useHttp();
    const { showToast } = useToast();
    const [isNotice, setIsNotice] = useState(initialData.isNotice);
    const [classes, setClasses] = useState<any[]>([]);

    const handleDelete = () => {
        confirmDialog({
            message: '이 공지사항을 삭제하시겠습니까?',
            header: '삭제 확인',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: '예',
            rejectLabel: '아니오',
            accept: async () => {
                try {
                    await http.post('/choiMath/notice/delete', { ids: [initialData.noticeId] });
                    showToast({ severity: 'success', summary: '삭제 완료', detail: '공지사항이 삭제되었습니다.' });
                    onDeleteSuccess();
                } catch (error) {
                    console.error('Delete error:', error);
                    showToast({ severity: 'error', summary: '삭제 실패', detail: '삭제 중 오류가 발생했습니다.' });
                }
            }
        });
    };

    const handleNotice = async (rowData) => {
        try {
            await http.post(`/choiMath/notice/publishNotice/${rowData.noticeId}`);
            showToast({
                severity: 'success',
                summary: '공지 설정',
                detail: '공지 상태로 변경되었습니다. 확인해주세요.'
            });
            onNoticeSuccess && onNoticeSuccess();
        } catch (error) {
            console.error('SetNotice error:', error);
            showToast({ severity: 'error', summary: '공지 설정 실패', detail: '공지 설정 중 오류가 발생했습니다.' });
        }
    };

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const response = await http.get('/choiMath/class/', { disableLoading: true });
                setClasses(response.data || []);
            } catch (error) {
                console.error('Fetch classes error:', error);
            }
        };
        fetchClasses();
    }, []);

    useEffect(() => {
        window.history.pushState(null, '', window.location.href);
        const handlePopState = () => {
            onBack();
        };
        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [onBack]);

    if (!initialData) {
        return <div className="p-5 text-center">존재하지 않거나 삭제된 공지사항입니다.</div>;
    }

    return (
        <div className="card">
            <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-4 border-bottom-1 surface-border pb-3">
                <div className="flex flex-column gap-2">
                    <div className="flex align-items-center gap-2">
                        <Button
                            icon="pi pi-arrow-left"
                            className="p-button-text mr-2"
                            onClick={() => window.history.back()}
                        />
                        {initialData?.isNotice && (
                            <span className="p-tag p-tag-success" style={{ minWidth: '60px', textAlign: 'center' }}>
                                <i className="pi pi-bell mr-1" />
                                공지
                            </span>
                        )}
                        {!initialData?.isNotice && (
                            <span className="p-tag p-tag-danger" style={{ minWidth: '60px', textAlign: 'center' }}>
                                <i className="pi pi-clock mr-1" />
                                미공지
                            </span>
                        )}

                        <h4 className="m-0">{initialData.title}</h4>
                    </div>
                    <span className="text-500 text-sm">
                        작성자: {initialData.createdUser} | 작성일:{' '}
                        {dayjs(initialData.createdDate).format('YYYY-MM-DD HH:mm:ss')}
                    </span>
                    {classes && classes.length > 0 && initialData.classIds && initialData.classIds.length > 0 && (
                        <div className="flex align-items-center gap-2 flex-wrap">
                            <span className="text-500 text-sm">대상 클래스:</span>
                            {initialData.classIds.map((id: string) => {
                                const matchedClass = classes.find((c) => c.classId === id);
                                return (
                                    <span key={id} className="p-tag p-tag-info">
                                        {matchedClass ? matchedClass.className : id}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div className="flex gap-2 mt-3 md:mt-0">
                    <Button
                        label="목록"
                        icon="pi pi-list"
                        className="p-button-secondary p-button-outlined"
                        onClick={() => window.history.back()}
                    />
                    {initialData?.isNotice ? (
                        <Button
                            label="공지해제"
                            icon="pi pi-bell-slash"
                            className="p-button-warning p-button-outlined"
                            onClick={() => handleNotice(initialData)}
                        />
                    ) : (
                        <Button
                            label="공지하기"
                            icon="pi pi-bell"
                            className="p-button-success p-button-outlined"
                            onClick={() => handleNotice(initialData)}
                        />
                    )}
                    <Button label="수정" icon="pi pi-pencil" className="p-button-outlined" onClick={onEdit} />
                    <Button
                        label="삭제"
                        icon="pi pi-trash"
                        className="p-button-danger p-button-outlined"
                        onClick={handleDelete}
                    />
                </div>
            </div>

            <div className="mt-4">
                <CustomEditor
                    delta={initialData.delta}
                    readOnly={true}
                    style={{ minHeight: '300px', border: 'none' }}
                />
            </div>
        </div>
    );
};

export default NoticeDetailView;
