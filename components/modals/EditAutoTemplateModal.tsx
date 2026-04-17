'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { CustomEditor, CustomEditorRef } from '../editor/CustomEditor';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import dayjs from 'dayjs';

/**
 * EditAutoTemplateModal
 * 자동 생성 시 적용될 기본 마스터 템플릿 내용을 관리하는 모달입니다.
 * 특정 년도, 월, 주차를 선택하고 조회하여 해당 시점의 기본 설정을 수정할 수 있습니다.
 */

interface EditAutoTemplateModalProps {
    visible: boolean;
    onClose: (result?: any) => void;
}

const EditAutoTemplateModal = ({ visible, onClose }: EditAutoTemplateModalProps) => {
    const http = useHttp();
    const { showToast } = useToast();
    const editorRef = useRef<CustomEditorRef>(null);

    const currentYear = dayjs().year();
    const currentMonth = dayjs().month() + 1;
    const currentWeek = Math.ceil(dayjs().date() / 7);

    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState(currentMonth);
    const [week, setWeek] = useState(currentWeek);
    const [templateList, setTemplateList] = useState<any[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

    const [template, setTemplate] = useState({
        shareTitle: '',
        shareContent: '',
        actualTitle: '',
        postContent: '',
        postContentDelta: null as any
    });

    const years = Array.from({ length: 3 }, (_, i) => ({
        label: `${currentYear - 1 + i}년`,
        value: currentYear - 1 + i
    }));
    const months = Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}월`, value: i + 1 }));
    const weeks = Array.from({ length: 5 }, (_, i) => ({ label: `${i + 1}주차`, value: i + 1 }));

    useEffect(() => {
        if (visible) {
            fetchTemplates();
        }
    }, [visible]);

    const fetchTemplates = async () => {
        try {
            const res = await http.get('/choiMath/template/');
            setTemplateList(res.data || []);
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        }
    };

    // 년도, 월, 주차 선택 후 조회 버튼 클릭 시 (추후 API 연동)
    const handleSearch = async () => {
        showToast({ severity: 'info', summary: '조회', detail: `${year}년 ${month}월 ${week}주차 데이터를 조회합니다.` });
        // TODO: 특정 시점의 마스터 템플릿을 가져오는 API 호출
    };

    const handleTemplateChange = (e: any) => {
        const templateId = e.value;
        setSelectedTemplateId(templateId);

        if (templateId) {
            const selected = templateList.find((t) => (t._id === templateId || t.templateId === templateId));
            if (selected) {
                setTemplate((prev) => ({
                    ...prev,
                    actualTitle: selected.templateName || selected.title || prev.actualTitle,
                    postContent: selected.content || '',
                    postContentDelta: selected.delta || null
                }));
            }
        }
    };

    const handleSave = async () => {
        try {
            const payload = {
                ...template,
                autoYear: String(year),
                autoMonth: String(month).padStart(2, '0'),
                autoWeek: String(week),
                postContentDelta: typeof template.postContentDelta === 'string' ? template.postContentDelta : JSON.stringify(template.postContentDelta)
            };

            // TODO: 마스터 템플릿 저장 API 호출
            console.log('Save Master Template:', payload);
            showToast({ severity: 'success', summary: '성공', detail: '마스터 템플릿이 저장되었습니다.' });
            onClose(true);
        } catch (error) {
            console.error(error);
            showToast({ severity: 'error', summary: '오류', detail: '저장에 실패했습니다.' });
        }
    };

    const insertVariable = (variable: string) => {
        editorRef.current?.insertText(variable);
    };

    const footer = (
        <div>
            <Button label="취소" icon="pi pi-times" onClick={() => onClose(null)} className="p-button-text" />
            <Button label="저장" icon="pi pi-check" onClick={handleSave} autoFocus />
        </div>
    );

    return (
        <Dialog
            header="자동 템플릿 설정 수정"
            visible={visible}
            style={{ width: '800px' }}
            footer={footer}
            onHide={() => onClose(null)}
            className="p-fluid"
        >
            <div className="grid mb-4">
                <div className="field col-3">
                    <label className="font-bold">년도</label>
                    <Dropdown value={year} options={years} onChange={(e) => setYear(e.value)} />
                </div>
                <div className="field col-3">
                    <label className="font-bold">월</label>
                    <Dropdown value={month} options={months} onChange={(e) => setMonth(e.value)} />
                </div>
                <div className="field col-3">
                    <label className="font-bold">주차</label>
                    <Dropdown value={week} options={weeks} onChange={(e) => setWeek(e.value)} />
                </div>
                <div className="field col-3 flex align-items-end">
                    <Button label="조회" icon="pi pi-search" onClick={handleSearch} className="p-button-info" />
                </div>
            </div>

            <div className="field">
                <label htmlFor="templateSelect" className="font-bold">기존 게시글 내용 템플릿 불러오기</label>
                <Dropdown
                    id="templateSelect"
                    value={selectedTemplateId}
                    options={[{ label: '직접 입력', value: null }, ...templateList.map(t => ({ label: t.templateName || t.title, value: t._id || t.templateId }))]}
                    onChange={handleTemplateChange}
                    placeholder="템플릿을 선택하세요"
                />
            </div>

            <div className="field">
                <label htmlFor="shareTitle" className="font-bold">카카오 공유 제목 (기본값)</label>
                <InputText
                    id="shareTitle"
                    value={template.shareTitle}
                    onChange={(e) => setTemplate(prev => ({ ...prev, shareTitle: e.target.value }))}
                />
            </div>

            <div className="field">
                <label htmlFor="shareContent" className="font-bold">카카오 공유 내용 (기본값)</label>
                <InputTextarea
                    id="shareContent"
                    value={template.shareContent}
                    onChange={(e) => setTemplate(prev => ({ ...prev, shareContent: e.target.value }))}
                    rows={3}
                />
            </div>

            <div className="field">
                <label htmlFor="actualTitle" className="font-bold">게시글 제목 (기본값)</label>
                <InputText
                    id="actualTitle"
                    value={template.actualTitle}
                    onChange={(e) => setTemplate(prev => ({ ...prev, actualTitle: e.target.value }))}
                />
            </div>

            <div className="field">
                <label className="font-bold">게시글 내용 (기본값)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                    <Button label="#{년도}" className="p-button-sm p-button-outlined p-button-secondary" style={{ width: 'auto' }} onClick={() => insertVariable('#{year}')} />
                    <Button label="#{월}" className="p-button-sm p-button-outlined p-button-secondary" style={{ width: 'auto' }} onClick={() => insertVariable('#{month}')} />
                    <Button label="#{주차}" className="p-button-sm p-button-outlined p-button-secondary" style={{ width: 'auto' }} onClick={() => insertVariable('#{week}')} />
                    <Button label="#{클래스명}" className="p-button-sm p-button-outlined p-button-secondary" style={{ width: 'auto' }} onClick={() => insertVariable('#{className}')} />
                    <Button label="#{학생명}" className="p-button-sm p-button-outlined p-button-secondary" style={{ width: 'auto' }} onClick={() => insertVariable('#{studentName}')} />
                </div>
                <CustomEditor
                    ref={editorRef}
                    value={template.postContent}
                    delta={template.postContentDelta}
                    onChange={(data) => setTemplate(prev => ({ ...prev, postContent: data.textValue, postContentDelta: data.delta }))}
                    style={{ height: '300px' }}
                />
            </div>
        </Dialog>
    );
};

export default EditAutoTemplateModal;
