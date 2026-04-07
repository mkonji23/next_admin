'use client';

import React from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { CustomEditor } from '@/components/editor/CustomEditor';

interface Feedback {
    id?: number | null;
    category: string;
    title: string;
    content: string;
    delta?: any;
}

interface FeedbackDialogContentProps {
    post: Feedback;
    onPostChange: (field: keyof Feedback, value: any) => void;
}

const FeedbackDialogContent: React.FC<FeedbackDialogContentProps> = ({ post, onPostChange }) => {
    const categories = [
        { label: '신규', value: '신규' },
        { label: '개선', value: '개선' },
        { label: '오류', value: '오류' },
        { label: '기타', value: '기타' }
    ];

    const handleEditorChange = ({ delta, textValue }: { delta: any, textValue: string }) => {
        onPostChange('delta', delta);
        onPostChange('content', textValue);
    };

    return (
        <div className="formgrid grid p-fluid">
            <div className="field col-12">
                <label htmlFor="category">구분</label>
                <Dropdown
                    id="category"
                    value={post.category}
                    options={categories}
                    onChange={(e) => onPostChange('category', e.value)}
                    placeholder="구분을 선택하세요"
                />
            </div>
            <div className="field col-12">
                <label htmlFor="title">제목</label>
                <InputText
                    id="title"
                    value={post.title}
                    onChange={(e) => onPostChange('title', e.target.value)}
                />
            </div>
            <div className="field col-12">
                <label htmlFor="content">내용</label>
                <CustomEditor
                    delta={post.delta}
                    onChange={handleEditorChange}
                    style={{ height: '250px' }}
                />
            </div>
        </div>
    );
};

export default FeedbackDialogContent;
