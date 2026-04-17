'use client';

import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import { useCustomModal } from '@/hooks/useCustomModal';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';
import dayjs from 'dayjs';

interface KakaoTemplate {
    templateId: string;
    templateName?: string;
    content: string;
    delta?: any;
    createdDate: string;
    updatedDate: string;
}

const KakaoShareTemplatePage = () => {
    const [templates, setTemplates] = useState<KakaoTemplate[]>([]);
    const [selectedTemplates, setSelectedTemplates] = useState<KakaoTemplate[] | null>(null);
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });

    const http = useHttp();
    const { showToast } = useToast();
    const { showConfirm } = useConfirm();
    const { openModal } = useCustomModal();

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await http.get('/choiMath/template/');
            setTemplates(res.data);
        } catch (error) {
            console.error(error);
            showToast({ severity: 'error', summary: '오류', detail: '템플릿 목록을 불러오는데 실패했습니다.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };
        _filters['global'].value = value;

        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const handleDelete = async (templateId: string) => {
        const confirmed = await showConfirm({
            header: '삭제 확인',
            message: '이 템플릿을 삭제하시겠습니까?',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: '삭제',
            rejectLabel: '취소'
        });

        if (confirmed) {
            try {
                await http.post('/choiMath/template/delete', { templateId: templateId });
                showToast({ severity: 'success', summary: '성공', detail: '템플릿이 삭제되었습니다.' });
                fetchTemplates();
            } catch (error) {
                console.error(error);
                showToast({ severity: 'error', summary: '삭제 실패', detail: '템플릿 삭제 중 오류가 발생했습니다.' });
            }
        }
    };

    const handleBulkDelete = async () => {
        if (!selectedTemplates || selectedTemplates.length === 0) return;

        const confirmed = await showConfirm({
            header: '선택 삭제 확인',
            message: `선택한 ${selectedTemplates.length}개의 템플릿을 삭제하시겠습니까?`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: '삭제',
            rejectLabel: '취소'
        });

        if (confirmed) {
            try {
                setLoading(true);
                // 개별 삭제 API를 루프 돌려 호출
                await Promise.all(
                    selectedTemplates.map((t) => http.post('/choiMath/template/delete', { templateId: t.templateId }))
                );
                showToast({ severity: 'success', summary: '성공', detail: '선택한 템플릿이 삭제되었습니다.' });
                setSelectedTemplates(null);
                fetchTemplates();
            } catch (error) {
                console.error(error);
                showToast({
                    severity: 'error',
                    summary: '삭제 실패',
                    detail: '일부 템플릿 삭제 중 오류가 발생했습니다.'
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const openTemplateModal = async (template?: KakaoTemplate) => {
        const result = await openModal({
            id: 'KakaoTemplateModal',
            pData: template
        });
        if (result) fetchTemplates();
    };

    const header = (
        <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
            <div className="flex gap-2">
                <Button label="신규" icon="pi pi-plus" severity="success" onClick={() => openTemplateModal()} />
                <Button
                    label="선택삭제"
                    icon="pi pi-trash"
                    severity="danger"
                    onClick={handleBulkDelete}
                    disabled={!selectedTemplates || !selectedTemplates.length}
                />
            </div>
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText value={globalFilterValue} onChange={onGlobalFilterChange} placeholder="검색어 입력" />
            </span>
        </div>
    );

    const titleBodyTemplate = (rowData: KakaoTemplate) => {
        return (
            <span
                className="text-blue-600 font-bold cursor-pointer hover:underline"
                onClick={(e) => {
                    e.stopPropagation();
                    openTemplateModal(rowData);
                }}
            >
                {rowData.templateName}
            </span>
        );
    };

    const actionBodyTemplate = (rowData: KakaoTemplate) => {
        console.log('rowData', rowData);
        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-pencil"
                    rounded
                    outlined
                    severity="info"
                    onClick={() => openTemplateModal(rowData)}
                />
                <Button
                    icon="pi pi-trash"
                    rounded
                    outlined
                    severity="danger"
                    onClick={() => handleDelete(rowData.templateId)}
                />
            </div>
        );
    };

    const dateBodyTemplate = (rowData: KakaoTemplate, field: 'createdDate' | 'updatedDate') => {
        if (!rowData[field]) return '-';
        return dayjs(rowData[field]).format('YYYY-MM-DD HH:mm');
    };

    return (
        <div className="card">
            <h5>카카오 공유 템플릿 관리</h5>
            <DataTable
                value={templates}
                paginator
                rows={10}
                dataKey="templateId"
                filters={filters}
                globalFilterFields={['templateName', 'content']}
                header={header}
                emptyMessage="등록된 템플릿이 없습니다."
                selection={selectedTemplates}
                onSelectionChange={(e) => setSelectedTemplates(e.value as KakaoTemplate[])}
            >
                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
                <Column
                    field="templateName"
                    header="제목"
                    body={titleBodyTemplate}
                    sortable
                    style={{ minWidth: '25rem' }}
                ></Column>
                <Column
                    field="createdDate"
                    header="생성일자"
                    body={(rowData) => dateBodyTemplate(rowData, 'createdDate')}
                    sortable
                ></Column>
                <Column
                    field="updatedDate"
                    header="수정일자"
                    body={(rowData) => dateBodyTemplate(rowData, 'updatedDate')}
                    sortable
                ></Column>
                <Column
                    header="액션"
                    body={actionBodyTemplate}
                    exportable={false}
                    style={{ minWidth: '8rem' }}
                ></Column>
            </DataTable>
        </div>
    );
};

export default KakaoShareTemplatePage;
