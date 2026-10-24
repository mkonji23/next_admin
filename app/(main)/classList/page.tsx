'use client';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { useEffect, useState } from 'react';
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
    const { showConfirm } = useConfirm();

    const getTodayString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    };

    const getClassStatus = (cls: Class): '개강전' | '진행중' | '종강' => {
        if (cls.isClosed) {
            return '종강';
        }
        const today = getTodayString();
        if (cls.endDate && cls.endDate < today) {
            return '종강';
        }
        if (cls.status === '개강전') {
            return '개강전';
        }
        if (cls.status === '진행중') {
            return '진행중';
        }
        if (!cls.startDate || cls.startDate > today) {
            return '개강전';
        }
        return '진행중';
    };

    const fetchClasses = async () => {
        try {
            setLoading(true);
            const response = await http.get('/choiMath/class/');
            const data = (response.data || []).map((cls: Class) => ({
                ...cls,
                status: cls.status || getClassStatus(cls)
            }));
            setClasses(data);
        } catch (error) {
            showToast({
                severity: 'error',
                summary: '조회 실패',
                detail: '클래스 목록을 불러오는데 실패했습니다.'
            });
        } finally {
            setLoading(false);
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

    const openCreateNextClassDialog = async (closedClass: Class) => {
        const isCreate = await showConfirm({
            header: '새 수업 클래스 생성',
            icon: 'pi pi-plus-circle',
            acceptClassName: 'p-button-success',
            message: `'${closedClass.className}' 클래스가 종강되었습니다.\n종강한 클래스 정보와 학생 데이터(${closedClass.students?.length || 0}명)를 이어받아 새로운 수업 클래스를 생성하시겠습니까?`,
            acceptLabel: '새 클래스 생성',
            rejectLabel: '닫기'
        });

        if (isCreate) {
            const result = await openModal({
                id: 'class',
                pData: {
                    mode: 'new',
                    class: {
                        ...closedClass,
                        classId: '',
                        className: closedClass.className,
                        teacher: closedClass.teacher,
                        students: closedClass.students || [],
                        description: closedClass.description,
                        startDate: '',
                        endDate: '',
                        isClosed: false,
                        status: '개강전'
                    }
                }
            });
            if (result) {
                fetchClasses();
            }
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
            const deletePromises = selectedClasses.map((cls) =>
                http.post('/choiMath/class/delete', { classId: cls.classId })
            );
            const results = await Promise.all(deletePromises);

            const successfulDeletions = results.filter((res) => res.data?.deletedCount > 0).length;

            if (successfulDeletions > 0) {
                showToast({
                    severity: 'success',
                    summary: '삭제 성공',
                    detail: `${successfulDeletions}개의 클래스가 삭제되었습니다.`
                });
                setSelectedClasses([]);
                fetchClasses();
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

    const statusBodyTemplate = (rowData: Class) => {
        const status = rowData.status || getClassStatus(rowData);
        switch (status) {
            case '종강':
                return <Tag severity="danger" value="종강" />;
            case '진행중':
                return <Tag severity="success" value="진행중" />;
            case '개강전':
            default:
                return <Tag severity="warning" value="개강전" />;
        }
    };

    const handleCloseClass = async (classData: Class) => {
        const isConfirmed = await showConfirm({
            header: '클래스 종강 처리',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            message: `'${classData.className}' 클래스를 종강 처리하시겠습니까?\n(종강일시가 오늘 날짜로 업데이트됩니다.)`
        });

        if (isConfirmed) {
            try {
                const today = getTodayString();
                await http.post('/choiMath/class/update', {
                    classId: classData.classId,
                    isClosed: true,
                    endDate: today,
                    status: '종강'
                });
                showToast({
                    severity: 'success',
                    summary: '종강 처리 성공',
                    detail: `'${classData.className}' 클래스가 종강 처리되었습니다.`
                });
                await fetchClasses();

                // 종강 후 새로운 수업 클래스 생성 안내 팝업 호출
                await openCreateNextClassDialog(classData);
            } catch (error: any) {
                console.error('Error closing class:', error);
                const errorMessage = error.response?.data?.message || error.message || '종강 처리에 실패했습니다.';
                showToast({ severity: 'error', summary: '종강 처리 실패', detail: errorMessage });
            }
        }
    };

    const handleOpenClass = async (classData: Class) => {
        const isConfirmed = await showConfirm({
            header: '클래스 개강 처리',
            icon: 'pi pi-play',
            acceptClassName: 'p-button-success',
            message: `'${classData.className}' 클래스를 개강 처리하시겠습니까?\n(개강일시가 오늘 날짜로 업데이트됩니다.)`
        });

        if (isConfirmed) {
            try {
                const today = getTodayString();
                await http.post('/choiMath/class/update', {
                    classId: classData.classId,
                    isClosed: false,
                    startDate: today,
                    endDate: null,
                    status: '진행중'
                });
                showToast({
                    severity: 'success',
                    summary: '개강 처리 성공',
                    detail: `'${classData.className}' 클래스가 개강 처리되었습니다.`
                });
                fetchClasses();
            } catch (error: any) {
                console.error('Error opening class:', error);
                const errorMessage = error.response?.data?.message || error.message || '개강 처리에 실패했습니다.';
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
                icon: 'pi pi-exclamation-triangle',
                acceptClassName: 'p-button-danger',
                message: `${selectedClasses.length}개의 클래스를 종강 처리하시겠습니까?\n(종강일시가 오늘 날짜로 업데이트됩니다.)`
            });
            if (!res) return;

            const today = getTodayString();
            const updatePromises = selectedClasses
                .filter((cls) => cls.classId)
                .map((cls) =>
                    http.post('/choiMath/class/update', {
                        classId: cls.classId,
                        isClosed: true,
                        endDate: today,
                        status: '종강'
                    })
                );

            await Promise.all(updatePromises);
            showToast({
                severity: 'success',
                summary: '종강 처리 성공',
                detail: `${selectedClasses.length}개의 클래스가 종강 처리되었습니다.`
            });

            const lastSelected = selectedClasses.length === 1 ? selectedClasses[0] : null;
            setSelectedClasses([]);
            await fetchClasses();

            if (lastSelected) {
                await openCreateNextClassDialog(lastSelected);
            }
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
                icon: 'pi pi-play',
                acceptClassName: 'p-button-success',
                message: `${selectedClasses.length}개의 클래스를 개강 처리하시겠습니까?\n(개강일시가 오늘 날짜로 업데이트됩니다.)`
            });
            if (!res) return;

            const today = getTodayString();
            const updatePromises = selectedClasses
                .filter((cls) => cls.classId)
                .map((cls) =>
                    http.post('/choiMath/class/update', {
                        classId: cls.classId,
                        isClosed: false,
                        startDate: today,
                        endDate: null,
                        status: '진행중'
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
        const status = rowData.status || getClassStatus(rowData);
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
                {status === '종강' ? (
                    <>
                        <Button
                            icon="pi pi-play"
                            rounded
                            outlined
                            severity="success"
                            onClick={() => handleOpenClass(rowData)}
                            tooltip="재개강"
                            tooltipOptions={{ position: 'top' }}
                        />
                        <Button
                            icon="pi pi-copy"
                            rounded
                            outlined
                            severity="info"
                            onClick={() => openCreateNextClassDialog(rowData)}
                            tooltip="새 수업으로 생성"
                            tooltipOptions={{ position: 'top' }}
                        />
                    </>
                ) : status === '개강전' ? (
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
                                        <span className="font-semibold text-lg">{student.name || student.userName || '이름 없음'}</span>
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

    const header = (rowData: any) => {
        return (
            <div className="flex flex-wrap align-items-center justify-content-between gap-2">
                <span className="text-xl text-900 font-bold">클래스 목록({rowData?.props?.value?.length || classes.length}개)</span>
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
    };

    return (
        <div className="card">
            <h1>클래스 목록</h1>
            <DataTable
                showGridlines
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
                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
                <Column field="classId" header="ID" sortable hidden filter></Column>
                <Column
                    field="className"
                    header="클래스명"
                    sortable
                    filter
                    headerStyle={{ minWidth: '150px' }}
                ></Column>
                <Column field="teacher" header="선생님" sortable filter headerStyle={{ minWidth: '100px' }}></Column>
                <Column field="description" header="설명" filter headerStyle={{ minWidth: '250px' }}></Column>
                <Column
                    field="startDate"
                    header="개강일시"
                    sortable
                    filter
                    body={startDateBodyTemplate}
                    headerStyle={{ minWidth: '150px' }}
                ></Column>
                <Column
                    field="endDate"
                    header="종강일시"
                    sortable
                    filter
                    body={endDateBodyTemplate}
                    headerStyle={{ minWidth: '150px' }}
                ></Column>
                <Column field="status" header="상태" sortable filter body={statusBodyTemplate}></Column>
                <Column body={actionBodyTemplate} header="작업" headerStyle={{ minWidth: '12rem' }}></Column>
            </DataTable>
        </div>
    );
};

export default ClassListPage;
