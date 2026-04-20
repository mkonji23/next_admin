import React, { useState, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { MultiSelect } from 'primereact/multiselect';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import useAuthStore from '@/store/useAuthStore';
import { CustomEditor } from '@/components/editor/CustomEditor';

interface NoticeWriteViewProps {
    onBack: () => void;
    onSuccess: () => void;
}

const NoticeWriteView: React.FC<NoticeWriteViewProps> = ({ onBack, onSuccess }) => {
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

    const [title, setTitle] = useState('');
    const [isNotice, setIsNotice] = useState(false);
    const [delta, setDelta] = useState<any>(null);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClasses, setSelectedClasses] = useState<any[]>([]);

    const http = useHttp();
    const { showToast } = useToast();
    const { userInfo } = useAuthStore();

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const response = await http.get('/choiMath/class/');
                setClasses(response.data || []);
            } catch (error) {
                console.error('Fetch classes error:', error);
            }
        };
        fetchClasses();
    }, []);

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
            if (selectedClasses.length > 0) {
                formData.append('classIds', JSON.stringify(selectedClasses));
            }

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
                <div className="flex align-items-center">
                    <Button
                        icon="pi pi-arrow-left"
                        className="p-button-text mr-2"
                        onClick={() => window.history.back()}
                    />
                    <h5 className="m-0">공지사항 작성</h5>
                </div>
                <div className="flex gap-2">
                    <Button
                        label="목록"
                        icon="pi pi-list"
                        className="p-button-secondary p-button-outlined"
                        onClick={() => window.history.back()}
                        disabled={loading}
                    />
                    <Button label="저장" icon="pi pi-check" onClick={handleSave} loading={loading} />
                </div>
            </div>

            <div className="flex flex-column gap-4">
                <div className="flex flex-column gap-2">
                    <label htmlFor="title" className="font-bold">
                        제목
                    </label>
                    <InputText
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="제목을 입력하세요"
                    />
                </div>

                <div className="flex flex-column gap-2">
                    <label htmlFor="classes" className="font-bold">
                        대상 클래스
                    </label>
                    <MultiSelect
                        id="classes"
                        value={selectedClasses}
                        options={classes}
                        onChange={(e) => setSelectedClasses(e.value)}
                        optionLabel="className"
                        optionValue="classId"
                        placeholder="공지할 클래스를 선택하세요 (전체 선택 가능)"
                        filter
                        className="w-full"
                        display="chip"
                    />
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
