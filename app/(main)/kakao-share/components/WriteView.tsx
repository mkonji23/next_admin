'use client';

import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { FileUpload } from 'primereact/fileupload';
import { useToast } from '@/hooks/useToast';

interface WriteViewProps {
    onBack: () => void;
    onSave: (formData: any, files: File[]) => Promise<void>;
}

const WriteView = ({ onBack, onSave }: WriteViewProps) => {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        shareTitle: '',
        shareContent: '',
        actualTitle: '',
        actualContent: ''
    });
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { shareTitle, shareContent, actualTitle, actualContent } = formData;
        
        if (!shareTitle || !shareContent || !actualTitle || !actualContent) {
            showToast({ severity: 'warn', summary: '입력 확인', detail: '모든 필드를 입력해주세요.' });
            return;
        }

        await onSave(formData, selectedFiles);
    };

    const onFileSelect = (e: any) => {
        setSelectedFiles(e.files);
    };

    return (
        <div className="card">
            <div className="flex align-items-center mb-4">
                <Button type="button" icon="pi pi-arrow-left" className="p-button-text mr-2" onClick={onBack} />
                <h5>새 게시글 작성</h5>
            </div>
            
            <form onSubmit={handleSubmit} className="p-fluid grid">
                <div className="field col-12 md:col-6">
                    <label htmlFor="actualTitle">실제 게시글 제목</label>
                    <InputText 
                        id="actualTitle" 
                        value={formData.actualTitle} 
                        onChange={(e) => setFormData({...formData, actualTitle: e.target.value})} 
                        placeholder="앱 내에서 보여질 제목" 
                        required
                    />
                </div>
                <div className="field col-12 md:col-6">
                    <label htmlFor="shareTitle">카카오 공유 제목</label>
                    <InputText 
                        id="shareTitle" 
                        value={formData.shareTitle} 
                        onChange={(e) => setFormData({...formData, shareTitle: e.target.value})} 
                        placeholder="카카오톡 링크 제목" 
                        required
                    />
                </div>
                <div className="field col-12">
                    <label htmlFor="shareContent">카카오 공유 설명</label>
                    <InputText 
                        id="shareContent" 
                        value={formData.shareContent} 
                        onChange={(e) => setFormData({...formData, shareContent: e.target.value})} 
                        placeholder="카카오톡 링크 설명" 
                        required
                    />
                </div>
                <div className="field col-12">
                    <label htmlFor="actualContent">게시글 상세 내용</label>
                    <InputTextarea 
                        id="actualContent" 
                        value={formData.actualContent} 
                        onChange={(e) => setFormData({...formData, actualContent: e.target.value})} 
                        rows={10} 
                        placeholder="상세 내용을 입력하세요." 
                        required
                    />
                </div>
                <div className="field col-12">
                    <label>이미지 첨부 (최대 5개)</label>
                    <FileUpload 
                        name="files" 
                        multiple 
                        accept="image/*" 
                        maxFileSize={5000000} 
                        onSelect={onFileSelect}
                        onClear={() => setSelectedFiles([])}
                        onRemove={(e: any) => setSelectedFiles(selectedFiles.filter(f => f !== e.file))}
                        emptyTemplate={<p className="m-0">파일을 드래그하거나 선택하세요.</p>}
                        customUpload
                        auto={false}
                        showUploadButton={false}
                    />
                </div>
                <div className="col-12 mt-4">
                    <Button type="submit" label="저장 및 등록" icon="pi pi-check" />
                </div>
            </form>
        </div>
    );
};

export default WriteView;
