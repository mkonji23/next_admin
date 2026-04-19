import React, { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import useAuthStore from '@/store/useAuthStore';
import { CustomEditor } from '@/components/editor/CustomEditor';

interface NoticeWriteViewProps {
    onBack: () => void;
    onSuccess: () => void;
}

const NoticeWriteView: React.FC<NoticeWriteViewProps> = ({ onBack, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [isNotice, setIsNotice] = useState(false);
    const [delta, setDelta] = useState<any>(null);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const http = useHttp();
    const { showToast } = useToast();
    const { userInfo } = useAuthStore();

    const handleSave = async () => {
        if (!title.trim()) {
            showToast({ severity: 'warn', summary: '필수 입력', detail: '제목을 입력해주세요.' });
            return;
        }

        if (!content.trim() && (!delta || delta.ops?.length === 0)) {
            showToast({ severity: 'warn', summary: '필수 입력', detail: '내용을 입력해주세요.' });
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            formData.append('delta', JSON.stringify(delta));
            formData.append('createdUser', userInfo?.userName || '관리자');
            formData.append('isNotice', String(isNotice));
            formData.append('folder', '/notice');

            await http.post('/choiMath/notice/save', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            showToast({ severity: 'success', summary: '저장 완료', detail: '공지사항이 성공적으로 등록되었습니다.' });
            onSuccess();
        } catch (error) {
            console.error('Save error:', error);
            showToast({ severity: 'error', summary: '저장 실패', detail: '저장 중 오류가 발생했습니다.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <div className="flex justify-content-between align-items-center mb-4">
                <h5 className="m-0">공지사항 작성</h5>
                <div className="flex gap-2">
                    <Button label="목록" icon="pi pi-list" className="p-button-secondary p-button-outlined" onClick={onBack} disabled={loading} />
                    <Button label="저장" icon="pi pi-check" onClick={handleSave} loading={loading} />
                </div>
            </div>

            <div className="flex flex-column gap-4">
                <div className="flex flex-column gap-2">
                    <label htmlFor="title" className="font-bold">제목</label>
                    <InputText id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목을 입력하세요" />
                </div>

                <div className="flex align-items-center gap-2">
                    <Checkbox inputId="isNotice" checked={isNotice} onChange={(e) => setIsNotice(e.checked || false)} />
                    <label htmlFor="isNotice" className="cursor-pointer">중요 공지로 등록 (상단 표시)</label>
                </div>

                <div className="flex flex-column gap-2">
                    <label className="font-bold">내용</label>
                    <CustomEditor 
                        onChange={({ textValue, delta: newDelta }) => {
                            setContent(textValue);
                            setDelta(newDelta);
                        }}
                        style={{ height: '400px' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default NoticeWriteView;
