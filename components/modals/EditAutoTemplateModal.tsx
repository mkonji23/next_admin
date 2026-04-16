'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { CustomEditor } from '@/components/editor/CustomEditor';
import { Message } from 'primereact/message';
import dayjs from 'dayjs';

interface EditAutoTemplateModalProps {
    visible: boolean;
    onClose: (result?: any) => void;
}

const EditAutoTemplateModal = ({ visible, onClose }: EditAutoTemplateModalProps) => {
    const currentYear = dayjs().year();
    const currentMonth = dayjs().month() + 1;
    const currentWeek = Math.ceil(dayjs().date() / 7);

    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState(currentMonth);
    const [week, setWeek] = useState(currentWeek);

    const [template, setTemplate] = useState({
        shareTitle: "[${m}월${w}주차: 학림 최하정T 주간REPORT '◡'✿]",
        shareContent: "${m}월${w}주차 출결/진도/클리닉/주간TEST성적을 열람하실 수 있습니다. 강사 최하정 : 010-5165-4609 ",
        actualTitle: "[${m}월${w}주차: 학림 최하정T 주간REPORT '◡'✿]",
        actualContent: "",
        delta: null
    });

    const years = Array.from({ length: 3 }, (_, i) => ({
        label: `${currentYear - 1 + i}년`,
        value: currentYear - 1 + i
    }));
    const months = Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}월`, value: i + 1 }));
    const weeks = Array.from({ length: 5 }, (_, i) => ({ label: `${i + 1}주차`, value: i + 1 }));

    const handleSave = () => {
        // 추후 API 연동 예정
        const saveData = {
            ...template,
            autoYear: String(year),
            autoMonth: String(month).padStart(2, '0'),
            autoWeek: String(week)
        };
        console.log('Template Saved:', saveData);
        onClose(true);
    };

    const footer = (
        <div>
            <Button label="취소" icon="pi pi-times" onClick={() => onClose(null)} className="p-button-text" />
            <Button label="저장 (임시)" icon="pi pi-check" onClick={handleSave} autoFocus />
        </div>
    );

    return (
        <Dialog
            header="자동 생성 마스터 템플릿 수정"
            visible={visible}
            style={{ width: '800px' }}
            footer={footer}
            onHide={() => onClose(null)}
            className="p-fluid"
        >
            <div className="flex flex-column gap-4">
                <div className="grid">
                    <div className="field col-4">
                        <label htmlFor="year" className="font-bold">년도</label>
                        <Dropdown id="year" value={year} options={years} onChange={(e) => setYear(e.value)} placeholder="년도" />
                    </div>
                    <div className="field col-4">
                        <label htmlFor="month" className="font-bold">월</label>
                        <Dropdown id="month" value={month} options={months} onChange={(e) => setMonth(e.value)} placeholder="월" />
                    </div>
                    <div className="field col-4">
                        <label htmlFor="week" className="font-bold">주차</label>
                        <Dropdown id="week" value={week} options={weeks} onChange={(e) => setWeek(e.value)} placeholder="주차" />
                    </div>
                </div>

                <Message 
                    severity="info" 
                    text="변수 가이드: ${y}=년도, ${m}=월, ${w}=주차, ${name}=학생명, ${school}=학교, ${grade}=학년 등을 사용하여 자동 치환할 수 있습니다." 
                    className="justify-content-start"
                />

                <div className="field">
                    <label htmlFor="shareTitle" className="font-bold">카카오 공유 제목 (Default)</label>
                    <InputText
                        id="shareTitle"
                        value={template.shareTitle}
                        onChange={(e) => setTemplate({ ...template, shareTitle: e.target.value })}
                        placeholder="카카오톡 공유 시 표시될 제목입니다."
                    />
                </div>

                <div className="field">
                    <label htmlFor="shareContent" className="font-bold">카카오 공유 설명 (Default)</label>
                    <InputTextarea
                        id="shareContent"
                        value={template.shareContent}
                        onChange={(e) => setTemplate({ ...template, shareContent: e.target.value })}
                        rows={3}
                        autoResize
                        placeholder="카카오톡 공유 시 표시될 설명 문구입니다."
                    />
                </div>

                <div className="field">
                    <label htmlFor="actualTitle" className="font-bold">리포트 게시글 제목 (Default)</label>
                    <InputText
                        id="actualTitle"
                        value={template.actualTitle}
                        onChange={(e) => setTemplate({ ...template, actualTitle: e.target.value })}
                        placeholder="상세 페이지 상단에 표시될 제목입니다."
                    />
                </div>

                <div className="field">
                    <label className="font-bold mb-2 block">리포트 본문 내용 (Default)</label>
                    <div className="surface-border border-1 border-round overflow-hidden">
                        <CustomEditor
                            value={template.actualContent}
                            delta={template.delta}
                            onChange={(data) => setTemplate({ ...template, actualContent: data.textValue, delta: data.delta })}
                            placeholder="리포트의 기본 본문 내용을 입력하세요. 변수를 섞어서 작성할 수 있습니다."
                            style={{ height: '400px' }}
                        />
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default EditAutoTemplateModal;
