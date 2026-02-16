'use client';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { useHttp } from '@/util/axiosInstance';
import { useCustomModal } from '@/hooks/useCustomModal'; // Import useCustomModal

// 1. Define Interface for Class
interface Class {
    classId: string;
    className: string;
    teacher: string;
    description: string;
    students?: { userId: string; userName: string }[]; // Add students property
}

const ClassListPage = () => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedClasses, setSelectedClasses] = useState<Class[]>([]);
    const { showToast } = useToast();
    const http = useHttp();
    const { openModal } = useCustomModal(); // Use useCustomModal

    const fetchClasses = async () => {
        try {
            const response = await http.get('/choiMath/class/');
            setClasses(response.data);
            showToast({ severity: 'success', summary: '조회 성공', detail: '클래스 목록을 불러왔습니다.' });
        } catch (error) {
            console.error('클래스 목록 조회 실패:', error);
            showToast({
                severity: 'error',
                summary: '조회 실패',
                detail: '클래스 목록을 불러오는데 실패했습니다.'
            });
        }
    };

    useEffect(() => {
        fetchClasses();
    }, []);

    const openNewClassDialog = async () => {
        const result = await openModal({ id: 'class', pData: { mode: 'new' } });
        if (result) {
            fetchClasses();
        }
    };

    const handleDeleteClasses = async () => {
        if (selectedClasses.length === 0) {
            showToast({ severity: 'warn', summary: '선택 오류', detail: '삭제할 클래스를 선택해주세요.' });
            return;
        }

        try {
            setLoading(true);
            // Send delete requests for all selected classes
            const deletePromises = selectedClasses.map((cls) =>
                http.post('/choiMath/class/delete', { classId: cls.classId })
            );
            const results = await Promise.all(deletePromises);

            const successfulDeletions = results.filter((res) => res.data.deletedCount > 0).length;

            if (successfulDeletions > 0) {
                showToast({
                    severity: 'success',
                    summary: '삭제 성공',
                    detail: `${successfulDeletions}개의 클래스가 삭제되었습니다.`
                });
                setSelectedClasses([]);
                fetchClasses(); // Refresh the list
            } else {
                showToast({ severity: 'warn', summary: '삭제 실패', detail: '선택된 클래스를 삭제하지 못했습니다.' });
            }
        } catch (error) {
            console.error('클래스 삭제 실패:', error);
            showToast({ severity: 'error', summary: '삭제 실패', detail: '클래스 삭제 중 오류가 발생했습니다.' });
        } finally {
            setLoading(false);
        }
    };

    const actionBodyTemplate = (rowData: Class) => {
        return (
            <Button
                icon="pi pi-pencil"
                rounded
                outlined
                severity="warning"
                onClick={async () => {
                    const result = await openModal({ id: 'class', pData: { mode: 'edit', class: rowData } });
                    if (result) {
                        fetchClasses(); // Refresh the list if a class was saved/updated
                    }
                }}
                tooltip="수정"
                tooltipOptions={{ position: 'top' }}
            />
        );
    };

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl text-900 font-bold">클래스 목록</span>
            <div className="flex gap-2">
                <Button
                    icon="pi pi-plus"
                    rounded
                    raised
                    label="신규"
                    onClick={openNewClassDialog}
                    className="p-button-info"
                />
                <Button
                    icon="pi pi-trash"
                    rounded
                    raised
                    label="삭제"
                    onClick={handleDeleteClasses}
                    className="p-button-danger"
                    disabled={selectedClasses.length === 0}
                />
                <Button
                    icon="pi pi-search"
                    rounded
                    raised
                    label="조회"
                    onClick={fetchClasses}
                    className="p-button-success"
                />
            </div>
        </div>
    );

    return (
        <div className="card">
            <h1>클래스 목록</h1>
            <DataTable
                value={classes}
                header={header}
                loading={loading}
                paginator
                rows={10}
                emptyMessage="클래스를 찾을 수 없습니다."
                selection={selectedClasses}
                onSelectionChange={(e) => setSelectedClasses(e.value as Class[])}
                dataKey="classId"
                selectionMode="checkbox"
            >
                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
                <Column field="classId" header="ID" sortable hidden></Column>
                <Column field="className" header="클래스명" sortable></Column>
                <Column field="teacher" header="선생님" sortable></Column>
                <Column field="description" header="설명"></Column>
                <Column body={actionBodyTemplate} header="작업" headerStyle={{ minWidth: '4rem' }}></Column>
            </DataTable>
        </div>
    );
};

export default ClassListPage;
