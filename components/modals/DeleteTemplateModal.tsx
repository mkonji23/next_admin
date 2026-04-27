'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import dayjs from 'dayjs';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';

interface DeleteTemplateModalProps {
    visible: boolean;
    onClose: (result?: any) => void;
}

const DeleteTemplateModal = ({ visible, onClose }: DeleteTemplateModalProps) => {
    const http = useHttp();
    const { showToast } = useToast();
    const { showConfirm } = useConfirm();
    const currentYear = dayjs().year();
    const currentMonth = dayjs().month() + 1;
    const currentWeek = Math.ceil(dayjs().date() / 7);

    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState(currentMonth);
    const [week, setWeek] = useState(currentWeek);
    const [password, setPassword] = useState('');

    const years = Array.from({ length: 3 }, (_, i) => ({
        label: `${currentYear - 1 + i}년`,
        value: currentYear - 1 + i
    }));
    const months = Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}월`, value: i + 1 }));
    const weeks = Array.from({ length: 5 }, (_, i) => ({ label: `${i + 1}주차`, value: i + 1 }));

    useEffect(() => {
        if (visible) {
            setYear(currentYear);
            setMonth(currentMonth);
            setWeek(currentWeek);
            setPassword('');
        }
    }, [visible, currentYear, currentMonth, currentWeek]);

    const handleDelete = async () => {
        try {
            const autoYear = String(year);
            const autoMonth = String(month).padStart(2, '0');
            const autoWeek = String(week);

            const confirmed = await showConfirm({
                header: '삭제',
                message: '템플릿 데이터를 삭제하시겠습니까?',
                icon: 'pi pi-exclamation-triangle',
                acceptLabel: '삭제',
                rejectLabel: '취소'
            });
            if (!confirmed) return;

            // API 엔드포인트는 create-auto 패턴(/choiMath/share/delete-auto)을 따름
            const res = await http.post(`/choiMath/share/delete-auto`, {
                autoYear: autoYear,
                autoMonth: autoMonth,
                autoWeek: autoWeek
            });

            if (res) {
                showToast({
                    severity: 'success',
                    summary: '자동 생성 데이터 삭제',
                    detail: `${year}년 ${month}월 ${week}주차 데이터가 삭제되었습니다.`
                });
                onClose(true);
            }
        } catch (error) {
            console.error('삭제 오류:', error);
            showToast({
                severity: 'error',
                summary: '삭제 실패',
                detail: '데이터 삭제 중 오류가 발생했습니다.'
            });
        }
    };

    const footer = (
        <div className="flex justify-content-end gap-2">
            <Button label="취소" icon="pi pi-times" onClick={() => onClose(null)} className="p-button-text" />
            <Button label="삭제" icon="pi pi-trash" severity="danger" onClick={handleDelete} autoFocus />
        </div>
    );

    return (
        <Dialog
            header="자동 생성 템플릿/데이터 삭제"
            visible={visible}
            style={{ width: '500px' }}
            footer={footer}
            onHide={() => onClose(null)}
            className="p-fluid"
        >
            <div className="flex flex-column gap-4">
                <div className="text-pink-600 font-bold">
                    <i className="pi pi-exclamation-triangle mr-2"></i>
                    자동생성된 데이터만 삭제됩니다.(글쓰기 데이터 제외)
                </div>
                <div className="grid">
                    <div className="field col-4">
                        <label htmlFor="delete-year" className="font-bold">
                            년도
                        </label>
                        <Dropdown
                            id="delete-year"
                            value={year}
                            options={years}
                            onChange={(e) => setYear(e.value)}
                            placeholder="년도"
                        />
                    </div>
                    <div className="field col-4">
                        <label htmlFor="delete-month" className="font-bold">
                            월
                        </label>
                        <Dropdown
                            id="delete-month"
                            value={month}
                            options={months}
                            onChange={(e) => setMonth(e.value)}
                            placeholder="월"
                        />
                    </div>
                    <div className="field col-4">
                        <label htmlFor="delete-week" className="font-bold">
                            주차
                        </label>
                        <Dropdown
                            id="delete-week"
                            value={week}
                            options={weeks}
                            onChange={(e) => setWeek(e.value)}
                            placeholder="주차"
                        />
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default DeleteTemplateModal;
