'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { CustomEditor, CustomEditorRef } from '../editor/CustomEditor';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';

interface KakaoTemplateModalProps {
    visible: boolean;
    onClose: (result?: any) => void;
    pData?: any;
}

const KakaoTemplateModal = ({ visible, onClose, pData }: KakaoTemplateModalProps) => {
    const [template, setTemplate] = useState({
        templateName: '',
        content: '',
        delta: null as any
    });

    const editorRef = useRef<CustomEditorRef>(null);
    const http = useHttp();
    const { showToast } = useToast();

    useEffect(() => {
        if (visible) {
            if (pData) {
                setTemplate({
                    templateName: pData.templateName || '',
                    content: pData.content || '',
                    delta: pData.delta || null
                });
            } else {
                setTemplate({
                    templateName: '',
                    content: '',
                    delta: null
                });
            }
        }
    }, [visible, pData]);

    const handleSave = async () => {
        if (!template.templateName.trim()) {
            showToast({ severity: 'error', summary: '필수 입력', detail: '제목을 입력해주세요.' });
            return;
        }

        try {
            const payload = {
                ...template,
                delta: typeof template.delta === 'string' ? template.delta : JSON.stringify(template.delta)
            };

            if (pData?.templateId) {
                // 수정: POST /choiMath/template/update (body에 templateId 포함)
                await http.post('/choiMath/template/update', { ...payload, templateId: pData.templateId });
                showToast({ severity: 'success', summary: '성공', detail: '템플릿이 수정되었습니다.' });
            } else {
                // 생성: POST /choiMath/template/
                await http.post('/choiMath/template/', payload);
                showToast({ severity: 'success', summary: '성공', detail: '새 템플릿이 등록되었습니다.' });
            }
            onClose(true);
        } catch (error: any) {
            console.error(error);
            const errMsg = error.response?.data?.error || '저장에 실패했습니다.';
            showToast({ severity: 'error', summary: '오류', detail: errMsg });
        }
    };

    const footer = (
        <div>
            <Button label="취소" icon="pi pi-times" onClick={() => onClose(null)} className="p-button-text" />
            <Button label="저장" icon="pi pi-check" onClick={handleSave} autoFocus />
        </div>
    );

    const insertVariable = (variable: string) => {
        editorRef.current?.insertText(variable);
    };

    return (
        <Dialog
            header={pData ? '템플릿 수정' : '새 템플릿 등록'}
            visible={visible}
            style={{ width: '800px' }}
            footer={footer}
            onHide={() => onClose(null)}
            className="p-fluid"
        >
            <div className="field">
                <label htmlFor="templateName" className="font-bold">
                    템플릿 제목 <span className="text-red-500">*</span>
                </label>
                <InputText
                    id="templateName"
                    value={template.templateName}
                    onChange={(e) => setTemplate((prev) => ({ ...prev, templateName: e.target.value }))}
                    placeholder="템플릿 이름을 입력하세요"
                />
            </div>

            <div className="field">
                <label className="font-bold">내용</label>
                <div className="flex flex-wrap gap-2 mb-2">
                    <span className="text-sm align-self-center mr-2 text-primary font-bold">변수 삽입:</span>
                    <Button
                        label="#{년도}"
                        className="p-button-sm p-button-outlined p-button-secondary"
                        style={{ width: 'auto' }}
                        onClick={() => insertVariable('#{year}')}
                    />
                    <Button
                        label="#{월}"
                        className="p-button-sm p-button-outlined p-button-secondary"
                        style={{ width: 'auto' }}
                        onClick={() => insertVariable('#{month}')}
                    />
                    <Button
                        label="#{주차}"
                        className="p-button-sm p-button-outlined p-button-secondary"
                        style={{ width: 'auto' }}
                        onClick={() => insertVariable('#{week}')}
                    />
                    <Button
                        label="#{클래스명}"
                        className="p-button-sm p-button-outlined p-button-secondary"
                        style={{ width: 'auto' }}
                        onClick={() => insertVariable('#{className}')}
                    />
                    <Button
                        label="#{학생명}"
                        className="p-button-sm p-button-outlined p-button-secondary"
                        style={{ width: 'auto' }}
                        onClick={() => insertVariable('#{studentName}')}
                    />
                </div>
                <CustomEditor
                    ref={editorRef}
                    value={template.content}
                    delta={template.delta}
                    onChange={(data) =>
                        setTemplate((prev) => ({ ...prev, content: data.textValue, delta: data.delta }))
                    }
                    style={{ height: '400px' }}
                    placeholder="템플릿 내용을 입력하세요. 상단의 변수 버튼을 클릭하여 변수를 삽입할 수 있습니다."
                />
            </div>
        </Dialog>
    );
};

export default KakaoTemplateModal;
