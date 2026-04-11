'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import dayjs from 'dayjs';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';
import useAuthStore from '@/store/useAuthStore';

interface ShareTemplateModalProps {
    visible: boolean;
    onClose: (result?: any) => void;
}

const ShareTemplateModal = ({ visible, onClose }: ShareTemplateModalProps) => {
    const http = useHttp();
    const { showToast } = useToast();
    const { showConfirm } = useConfirm();
    const currentYear = dayjs().year();
    const currentMonth = dayjs().month() + 1;
    const currentWeek = Math.ceil(dayjs().date() / 7);

    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState(currentMonth);
    const [week, setWeek] = useState(currentWeek);
    const [template, setTemplate] = useState({
        shareTitle: '',
        shareContent: '',
        actualTitle: '',
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

    const updateTemplate = (y: number, m: number, w: number) => {
        const title = `[${m}월${w}주차: 학림 최하정T 주간REPORT '◡'✿]`;
        const content = `${m}월${w}주차 출결/진도/클리닉/주간TEST성적을 열람하실 수 있습니다. 강사 최하정 : 010-5165-4609 `;

        setTemplate({
            shareTitle: title,
            shareContent: content,
            actualTitle: title,
            autoYear: String(y),
            autoMonth: String(m).padStart(2, '0'),
            autoWeek: String(w)
        });
    };

    useEffect(() => {
        if (visible) {
            setYear(currentYear);
            setMonth(currentMonth);
            setWeek(currentWeek);
            updateTemplate(currentYear, currentMonth, currentWeek);
        }
    }, [visible, currentYear, currentMonth, currentWeek]);

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
            const cdata = await http.post('/choiMath/share/get-dup-check', template);
            if (cdata?.data.isDuplicate) {
                const confirmed = await showConfirm({
                    header: '중복 데이터 확인',
                    message: '이미 생성된 템플릿 데이터가 있습니다. \r\n 기존 자동 데이터를 삭제하고 진행하시겠습니까?',
                    icon: 'pi pi-exclamation-triangle',
                    acceptLabel: '생성',
                    rejectLabel: '취소'
                });
                if (!confirmed) return;
            }

            const res = await http.post('/choiMath/share/create-auto', template);
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
        }
    };

    const footer = (
        <div>
            <Button label="취소" icon="pi pi-times" onClick={() => onClose(null)} className="p-button-text" />
            <Button label="적용" icon="pi pi-check" onClick={handleSave} autoFocus />
        </div>
    );

    return (
        <Dialog
            header="주간 리포트 템플릿 생성"
            visible={visible}
            style={{ width: '500px' }}
            footer={footer}
            onHide={() => onClose(null)}
            className="p-fluid"
        >
            <div className="grid">
                <div className="field col-4">
                    <label htmlFor="year">년도</label>
                    <Dropdown id="year" value={year} options={years} onChange={handleYearChange} placeholder="년도" />
                </div>
                <div className="field col-4">
                    <label htmlFor="month">월</label>
                    <Dropdown id="month" value={month} options={months} onChange={handleMonthChange} placeholder="월" />
                </div>
                <div className="field col-4">
                    <label htmlFor="week">주차</label>
                    <Dropdown id="week" value={week} options={weeks} onChange={handleWeekChange} placeholder="주차" />
                </div>
            </div>

            <div className="field">
                <label htmlFor="shareTitle">카카오 공유 제목</label>
                <InputText
                    id="shareTitle"
                    value={template.shareTitle}
                    onChange={(e) => setTemplate({ ...template, shareTitle: e.target.value })}
                />
            </div>

            <div className="field">
                <label htmlFor="shareContent">카카오 공유 내용</label>
                <InputTextarea
                    id="shareContent"
                    value={template.shareContent}
                    onChange={(e) => setTemplate({ ...template, shareContent: e.target.value })}
                    rows={4}
                    autoResize
                />
            </div>

            <div className="field">
                <label htmlFor="actualTitle">게시글 제목</label>
                <InputText
                    id="actualTitle"
                    value={template.actualTitle}
                    onChange={(e) => setTemplate({ ...template, actualTitle: e.target.value })}
                />
            </div>
        </Dialog>
    );
};

export default ShareTemplateModal;
