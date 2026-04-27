'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import dayjs from 'dayjs';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';
import { CustomEditor, CustomEditorRef } from '../editor/CustomEditor';

/**
 * ShareAutoTemplateModal
 * 카카오 공유하기용 자동 템플릿 생성 모달 컴포넌트입니다.
 * 주간 리포트 등을 위해 년도, 월, 주차별로 일괄 템플릿을 생성하는 기능을 제공하며,
 * 기존에 정의된 공유 템플릿 관리의 목록을 불러와서 적용할 수 있습니다.
 */

interface ShareAutoTemplateModalProps {
    visible: boolean;
    onClose: (result?: any) => void;
}

const ShareAutoTemplateModal = ({ visible, onClose }: ShareAutoTemplateModalProps) => {
    const http = useHttp();
    const { showToast } = useToast();
    const { showConfirm } = useConfirm();
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
        postContentDelta: null as any,
        autoYear: '',
        autoMonth: '',
        autoWeek: ''
    });

    const years = Array.from({ length: 3 }, (_, i) => ({
        label: `${currentYear - 1 + i}년`,
        value: currentYear - 1 + i
    }));
    const months = Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}월`, value: i + 1 }));
    const weeks = Array.from({ length: 5 }, (_, i) => ({ label: `${i + 1}주차`, value: i + 1 }));

    // 공유 템플릿 관리 목록 조회
    const fetchTemplates = async () => {
        try {
            const res = await http.get('/choiMath/template/');
            setTemplateList(res.data || []);
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        }
    };

    const updateTemplate = (y: number, m: number, w: number) => {
        const title = `[${m}월${w}주차: 학림 최하정T 주간REPORT '◡'✿]`;
        const content = `${m}월${w}주차 출결/진도/클리닉/주간TEST성적을 열람하실 수 있습니다. 강사 최하정 : 010-5165-4609 `;

        setTemplate((prev) => ({
            ...prev,
            shareTitle: title,
            shareContent: content,
            actualTitle: title,
            autoYear: String(y),
            autoMonth: String(m).padStart(2, '0'),
            autoWeek: String(w)
        }));
    };

    useEffect(() => {
        if (visible) {
            setYear(currentYear);
            setMonth(currentMonth);
            setWeek(currentWeek);
            setSelectedTemplateId(null);
            updateTemplate(currentYear, currentMonth, currentWeek);
            fetchTemplates();
        }
    }, [visible]);

    // 템플릿 선택 핸들러
    const handleTemplateChange = (e: any) => {
        const templateId = e.value;
        setSelectedTemplateId(templateId);

        if (templateId) {
            const selected = templateList.find((t) => t._id === templateId || t.templateId === templateId);
            if (selected) {
                setTemplate((prev) => ({
                    ...prev,
                    postContent: selected.content || '',
                    postContentDelta: selected.delta || null,
                    templateId: templateId
                }));
            }
        } else {
            setTemplate((prev) => ({
                ...prev,
                postContent: '',
                postContentDelta: null,
                templateId: null
            }));
        }
    };

    const handleYearChange = (e: any) => {
        const y = e.value;
        setYear(y);
        updateTemplate(y, month, week);
    };

    const handleMonthChange = (e: any) => {
        const m = e.value;
        setMonth(m);
        updateTemplate(year, m, week);
    };

    const handleWeekChange = (e: any) => {
        const w = e.value;
        setWeek(w);
        updateTemplate(year, month, w);
    };

    const handleSave = async () => {
        try {
            const saveData = {
                ...template,
                postContentDelta:
                    typeof template.postContentDelta === 'string'
                        ? template.postContentDelta
                        : JSON.stringify(template.postContentDelta)
            };

            const cdata = await http.post('/choiMath/share/get-dup-check', saveData);

            if (cdata?.data.isDuplicate) {
                showToast({
                    severity: 'warn',
                    summary: '중복 데이터 확인',
                    detail: '이미 생성된 템플릿 데이터가 있습니다.'
                });
                return;
            }

            const res = await http.post('/choiMath/share/create-auto', saveData);
            if (res?.data?.acknowledged) {
                showToast({
                    severity: 'success',
                    summary: '카카오 공유 자동 템플릿 생성',
                    detail: `${year}년 ${month}월 ${week}주차 템플릿 ${
                        res?.data?.insertedCount || 0
                    }개가 생성되었습니다.`
                });
            }
            onClose && onClose(true);
        } catch (error) {
            console.error(error);
            showToast({ severity: 'error', summary: '오류', detail: '템플릿 생성에 실패했습니다.' });
        }
    };

    const footer = (
        <div>
            <Button label="취소" icon="pi pi-times" onClick={() => onClose(null)} className="p-button-text" />
            <Button label="생성" icon="pi pi-check" onClick={handleSave} autoFocus />
        </div>
    );

    return (
        <Dialog
            header="주간 리포트 자동 생성"
            visible={visible}
            style={{ width: '900px' }}
            footer={footer}
            onHide={() => onClose(null)}
            className="p-fluid"
        >
            <div className="grid">
                <div className="field col-4">
                    <label htmlFor="year">
                        년도<span className="text-red-500 font-bold">*</span>
                    </label>
                    <Dropdown id="year" value={year} options={years} onChange={handleYearChange} placeholder="년도" />
                </div>
                <div className="field col-4">
                    <label htmlFor="month">
                        월<span className="text-red-500 font-bold">*</span>
                    </label>
                    <Dropdown id="month" value={month} options={months} onChange={handleMonthChange} placeholder="월" />
                </div>
                <div className="field col-4">
                    <label htmlFor="week">
                        주차<span className="text-red-500 font-bold">*</span>
                    </label>
                    <Dropdown id="week" value={week} options={weeks} onChange={handleWeekChange} placeholder="주차" />
                </div>
            </div>

            <div className="field">
                <label htmlFor="shareTitle">
                    카카오 공유 제목<span className="text-red-500 font-bold">*</span>
                </label>
                <InputText
                    id="shareTitle"
                    value={template.shareTitle}
                    onChange={(e) => setTemplate((prev) => ({ ...prev, shareTitle: e.target.value }))}
                />
            </div>

            <div className="field">
                <label htmlFor="shareContent">카카오 공유 내용</label>
                <InputTextarea
                    id="shareContent"
                    value={template.shareContent}
                    onChange={(e) => setTemplate((prev) => ({ ...prev, shareContent: e.target.value }))}
                    rows={4}
                    autoResize
                />
            </div>

            <div className="field">
                <label htmlFor="actualTitle">
                    게시글 제목<span className="text-red-500 font-bold">*</span>
                </label>
                <InputText
                    id="actualTitle"
                    value={template.actualTitle}
                    onChange={(e) => setTemplate((prev) => ({ ...prev, actualTitle: e.target.value }))}
                />
            </div>

            <div className="field">
                <div className="field">
                    <label htmlFor="templateSelect" className="font-bold">
                        템플릿 불러오기
                    </label>
                    <Dropdown
                        id="templateSelect"
                        value={selectedTemplateId}
                        options={[
                            { label: '직접 입력', value: null },
                            ...templateList.map((t) => ({
                                label: t.templateName || t.title,
                                value: t._id || t.templateId
                            }))
                        ]}
                        onChange={handleTemplateChange}
                        placeholder="직접 입력"
                    />
                </div>
                <label className="font-bold">게시글 내용</label>
                <div className="flex flex-wrap gap-2 mb-2">
                    <span className="text-sm align-self-center mr-2 text-primary font-bold">변수 클릭 시 삽입:</span>
                    <Button
                        label="#{년도}"
                        className="p-button-sm p-button-outlined p-button-secondary"
                        style={{ width: 'auto' }}
                        onClick={() => editorRef.current?.insertText('#{year}')}
                    />
                    <Button
                        label="#{월}"
                        className="p-button-sm p-button-outlined p-button-secondary"
                        style={{ width: 'auto' }}
                        onClick={() => editorRef.current?.insertText('#{month}')}
                    />
                    <Button
                        label="#{주차}"
                        className="p-button-sm p-button-outlined p-button-secondary"
                        style={{ width: 'auto' }}
                        onClick={() => editorRef.current?.insertText('#{week}')}
                    />
                    <Button
                        label="#{클래스명}"
                        className="p-button-sm p-button-outlined p-button-secondary"
                        style={{ width: 'auto' }}
                        onClick={() => editorRef.current?.insertText('#{className}')}
                    />
                    <Button
                        label="#{학생명}"
                        className="p-button-sm p-button-outlined p-button-secondary"
                        style={{ width: 'auto' }}
                        onClick={() => editorRef.current?.insertText('#{studentName}')}
                    />
                </div>
                <CustomEditor
                    ref={editorRef}
                    value={template.postContent}
                    delta={template.postContentDelta}
                    onChange={(data) => {
                        setTemplate((prev) => ({
                            ...prev,
                            postContent: data.textValue,
                            postContentDelta: data.delta
                        }));
                        // 사용자가 직접 수정하면 템플릿 선택 초기화
                        setSelectedTemplateId(null);
                    }}
                    style={{ height: '300px' }}
                />
            </div>
        </Dialog>
    );
};

export default ShareAutoTemplateModal;
