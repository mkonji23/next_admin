'use client';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Chip } from 'primereact/chip';
import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { useHttp } from '@/util/axiosInstance';
import { useCustomModal } from '@/hooks/useCustomModal';
import { useConfirm } from '@/hooks/useConfirm';

import { Class } from '@/types/class';

const ClassListPage = () => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedClasses, setSelectedClasses] = useState<Class[]>([]);
    const [expandedRows, setExpandedRows] = useState<any>({});
    const { showToast } = useToast();
    const http = useHttp();
    const { openModal } = useCustomModal();
    const { showConfirm } = useConfirm(); // Use useCustomModal

    const fetchClasses = async () => {
        try {
            const response = await http.get('/choiMath/class/');
            setClasses(response.data);
        } catch (error) {
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
            const res = await showConfirm({
                header: '클래스 삭제',
                message: `${selectedClasses.length}개의 클래스를 삭제하시겠습니까?`
            });
            if (!res) return;

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

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        if (dateString.length === 8) {
            // YYYYMMDD 형식
            return `${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}`;
        }
        return dateString;
    };

    const startDateBodyTemplate = (rowData: Class) => {
        return formatDate(rowData.startDate);
    };

    const endDateBodyTemplate = (rowData: Class) => {
        return formatDate(rowData.endDate);
    };

    const isClosedBodyTemplate = (rowData: Class) => {
        return rowData.isClosed ? (
            <Tag severity="danger" value="종강" />
        ) : (
            <Tag severity="success" value="진행중" />
        );
    };

    const handleCloseClass = async (classData: Class) => {
        const isConfirmed = await showConfirm({
            header: '클래스 종강 처리',
            message: `'${classData.className}' 클래스를 종강 처리하시겠습니까?`
        });

        if (isConfirmed) {
            try {
                await http.post('/choiMath/class/update', {
                    classId: classData.classId,
                    isClosed: true
                });
                showToast({
                    severity: 'success',
                    summary: '종강 처리 성공',
                    detail: '클래스가 종강 처리되었습니다.'
                });
                fetchClasses();
            } catch (error: any) {
                console.error('Error closing class:', error);
                const errorMessage =
                    error.response?.data?.message || error.message || '종강 처리에 실패했습니다.';
                showToast({ severity: 'error', summary: '종강 처리 실패', detail: errorMessage });
            }
        }
    };

    const handleOpenClass = async (classData: Class) => {
        const isConfirmed = await showConfirm({
            header: '클래스 개강 처리',
            message: `'${classData.className}' 클래스를 개강 처리하시겠습니까?`
        });

        if (isConfirmed) {
            try {
                await http.post('/choiMath/class/update', {
                    classId: classData.classId,
                    isClosed: false
                });
                showToast({
                    severity: 'success',
                    summary: '개강 처리 성공',
                    detail: '클래스가 개강 처리되었습니다.'
                });
                fetchClasses();
            } catch (error: any) {
                console.error('Error opening class:', error);
                const errorMessage =
                    error.response?.data?.message || error.message || '개강 처리에 실패했습니다.';
                showToast({ severity: 'error', summary: '개강 처리 실패', detail: errorMessage });
            }
        }
    };

    const handleCloseClasses = async () => {
        if (selectedClasses.length === 0) {
            showToast({ severity: 'warn', summary: '선택 오류', detail: '종강 처리할 클래스를 선택해주세요.' });
            return;
        }

        try {
            const res = await showConfirm({
                header: '클래스 종강 처리',
                message: `${selectedClasses.length}개의 클래스를 종강 처리하시겠습니까?`
            });
            if (!res) return;

            const updatePromises = selectedClasses
                .filter((cls) => cls.classId)
                .map((cls) =>
                    http.post('/choiMath/class/update', {
                        classId: cls.classId,
                        isClosed: true
                    })
                );

            await Promise.all(updatePromises);
            showToast({
                severity: 'success',
                summary: '종강 처리 성공',
                detail: `${selectedClasses.length}개의 클래스가 종강 처리되었습니다.`
            });
            setSelectedClasses([]);
            fetchClasses();
        } catch (error: any) {
            console.error('Error closing classes:', error);
            const errorMessage = error.response?.data?.message || error.message || '종강 처리에 실패했습니다.';
            showToast({ severity: 'error', summary: '종강 처리 실패', detail: errorMessage });
        }
    };

    const handleOpenClasses = async () => {
        if (selectedClasses.length === 0) {
            showToast({ severity: 'warn', summary: '선택 오류', detail: '개강 처리할 클래스를 선택해주세요.' });
            return;
        }

        try {
            const res = await showConfirm({
                header: '클래스 개강 처리',
                message: `${selectedClasses.length}개의 클래스를 개강 처리하시겠습니까?`
            });
            if (!res) return;

            const updatePromises = selectedClasses
                .filter((cls) => cls.classId)
                .map((cls) =>
                    http.post('/choiMath/class/update', {
                        classId: cls.classId,
                        isClosed: false
                    })
                );

            await Promise.all(updatePromises);
            showToast({
                severity: 'success',
                summary: '개강 처리 성공',
                detail: `${selectedClasses.length}개의 클래스가 개강 처리되었습니다.`
            });
            setSelectedClasses([]);
            fetchClasses();
        } catch (error: any) {
            console.error('Error opening classes:', error);
            const errorMessage = error.response?.data?.message || error.message || '개강 처리에 실패했습니다.';
            showToast({ severity: 'error', summary: '개강 처리 실패', detail: errorMessage });
        }
    };

    const actionBodyTemplate = (rowData: Class) => {
        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-pencil"
                    rounded
                    outlined
                    severity="warning"
                    onClick={async () => {
                        const result = await openModal({ id: 'class', pData: { mode: 'edit', class: rowData } });
                        if (result) {
                            fetchClasses();
                        }
                    }}
                    tooltip="수정"
                    tooltipOptions={{ position: 'top' }}
                />
                {rowData.isClosed ? (
                    <Button
                        icon="pi pi-play"
                        rounded
                        outlined
                        severity="success"
                        onClick={() => handleOpenClass(rowData)}
                        tooltip="개강"
                        tooltipOptions={{ position: 'top' }}
                    />
                ) : (
                    <Button
                        icon="pi pi-stop"
                        rounded
                        outlined
                        severity="danger"
                        onClick={() => handleCloseClass(rowData)}
                        tooltip="종강"
                        tooltipOptions={{ position: 'top' }}
                    />
                )}
            </div>
        );
    };

    const rowExpansionTemplate = (rowData: Class) => {
        return (
            <div className="p-3">
                <div className="flex align-items-center justify-content-between mb-3">
                    <h5 className="m-0">등록된 학생 목록</h5>
                    <Tag value={`총 ${rowData.students?.length || 0}명`} severity="info" />
                </div>
                {rowData.students && rowData.students.length > 0 ? (
                    <div className="grid">
                        {rowData.students.map((student, index) => (
                            <div key={student.studentId || index} className="col-12 md:col-6 lg:col-4">
                                <div className="surface-card border-round p-3 shadow-1">
                                    <div className="flex align-items-center gap-2 mb-2">
                                        <i className="pi pi-user text-primary"></i>
                                        <span className="font-semibold text-lg">
                                            {student.name || '이름 없음'}
                                        </span>
                                    </div>
                                    <div className="flex flex-column gap-1">
                                        {student.grade && (
                                            <div className="flex align-items-center gap-2">
                                                <span className="text-500 text-sm">학년:</span>
                                                <span className="text-900">{student.grade}</span>
                                            </div>
                                        )}
                                        {student.school && (
                                            <div className="flex align-items-center gap-2">
                                                <span className="text-500 text-sm">학교:</span>
                                                <span className="text-900">{student.school}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-500">등록된 학생이 없습니다.</div>
                )}
            </div>
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
                    icon="pi pi-play"
                    rounded
                    raised
                    label="개강"
                    onClick={handleOpenClasses}
                    className="p-button-success"
                    disabled={selectedClasses.length === 0}
                />
                <Button
                    icon="pi pi-stop"
                    rounded
                    raised
                    label="종강"
                    onClick={handleCloseClasses}
                    className="p-button-warning"
                    disabled={selectedClasses.length === 0}
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
                expandedRows={expandedRows}
                onRowToggle={(e) => setExpandedRows(e.data)}
                rowExpansionTemplate={rowExpansionTemplate}
            >
                <Column expander style={{ width: '3rem' }} />
                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} ></Column>
                <Column field="classId" header="ID" sortable hidden filter></Column>
                <Column field="className" header="클래스명" sortable filter></Column>
                <Column field="teacher" header="선생님" sortable filter></Column>
                <Column field="description" header="설명" filter></Column>
                <Column field="startDate" header="개강일시" sortable filter body={startDateBodyTemplate}></Column>
                <Column field="endDate" header="종강일시" sortable filter body={endDateBodyTemplate}></Column>
                <Column field="isClosed" header="상태" sortable filter body={isClosedBodyTemplate}></Column>
                <Column body={actionBodyTemplate} header="작업" headerStyle={{ minWidth: '10rem' }}></Column>
            </DataTable>
        </div>
    );
};

export default ClassListPage;
