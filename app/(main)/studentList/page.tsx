'use client';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { useEffect, useState, useCallback } from 'react';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { Student } from '@/components/modals/StudentModal';
import { useCustomModal } from '@/hooks/useCustomModal';
import { useConfirm } from '@/hooks/useConfirm';

const StudentListPage = () => {
    const { openModal } = useCustomModal();
    const { showConfirm } = useConfirm();
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
    const [expandedRows, setExpandedRows] = useState<any>({});
    const http = useHttp();
    const { showToast } = useToast();

    const fetchStudents = useCallback(async () => {
        try {
            const response = await http.get('/choiMath/student/getStudentList');
            setStudents(response.data || []);
        } catch (error) {
            console.error('Error fetching students:', error);
            showToast({ severity: 'error', summary: '조회 실패', detail: '학생 목록을 불러오는데 실패했습니다.' });
        }
    }, [http, showToast]);

    useEffect(() => {
        fetchStudents();
    }, []);

    const openEditDialog = async (student: Student) => {
        const result = await openModal({
            id: 'student',
            pData: {
                mode: 'edit',
                student: student
            }
        });
        if (result) {
            fetchStudents();
        }
    };

    const openNewStudentDialog = async () => {
        const result = await openModal({
            id: 'student',
            pData: {
                mode: 'new'
            }
        });
        if (result) {
            fetchStudents();
        }
    };

    const handleDeleteStudent = async (studentId: string, name: string) => {
        const isConfirmed = await showConfirm({
            header: '학생 삭제',
            message: `'${name}' 학생을 삭제하시겠습니까?`
        });

        if (isConfirmed) {
            try {
                await http.post('/choiMath/student/deleteStudent', { studentId });
                showToast({
                    severity: 'success',
                    summary: '삭제 성공',
                    detail: '학생이 삭제되었습니다.'
                });
                fetchStudents();
            } catch (error: any) {
                console.error('Error deleting student:', error);
                const errorMessage = error.response?.data?.message || error.message || '학생 삭제에 실패했습니다.';
                showToast({ severity: 'error', summary: '삭제 실패', detail: errorMessage });
            }
        }
    };

    const handleDeleteStudents = async () => {
        if (selectedStudents.length === 0) {
            showToast({ severity: 'warn', summary: '선택 오류', detail: '삭제할 학생을 선택해주세요.' });
            return;
        }

        try {
            const res = await showConfirm({
                header: '학생 삭제',
                message: `${selectedStudents.length}명의 학생을 삭제하시겠습니까?`
            });
            if (!res) return;
            const studentIds = selectedStudents.map((student) => student.studentId).filter(Boolean) as string[];
            await http.post('/choiMath/student/deleteStudents', { data: { studentIds } });
            showToast({
                severity: 'success',
                summary: '삭제 성공',
                detail: `${selectedStudents.length}명의 학생이 삭제되었습니다.`
            });
            setSelectedStudents([]);
            fetchStudents();
        } catch (error: any) {
            console.error('Error deleting students:', error);
            const errorMessage = error.response?.data?.message || error.message || '학생 삭제에 실패했습니다.';
            showToast({ severity: 'error', summary: '삭제 실패', detail: errorMessage });
        }
    };

    const handleWithdrawStudents = async () => {
        if (selectedStudents.length === 0) {
            showToast({ severity: 'warn', summary: '선택 오류', detail: '퇴원 처리할 학생을 선택해주세요.' });
            return;
        }

        try {
            const res = await showConfirm({
                header: '학생 퇴원 처리',
                message: `${selectedStudents.length}명의 학생을 퇴원 처리하시겠습니까?`
            });
            if (!res) return;

            // 선택된 학생들의 isWithdrawn을 true로 업데이트
            const updatePromises = selectedStudents
                .filter((student) => student.studentId)
                .map((student) =>
                    http.post('/choiMath/student/updateStudent', {
                        studentId: student.studentId,
                        isWithdrawn: true
                    })
                );

            await Promise.all(updatePromises);
            showToast({
                severity: 'success',
                summary: '퇴원 처리 성공',
                detail: `${selectedStudents.length}명의 학생이 퇴원 처리되었습니다.`
            });
            setSelectedStudents([]);
            fetchStudents();
        } catch (error: any) {
            console.error('Error withdrawing students:', error);
            const errorMessage = error.response?.data?.message || error.message || '퇴원 처리에 실패했습니다.';
            showToast({ severity: 'error', summary: '퇴원 처리 실패', detail: errorMessage });
        }
    };

    const handleEnrollStudents = async () => {
        if (selectedStudents.length === 0) {
            showToast({ severity: 'warn', summary: '선택 오류', detail: '입원 처리할 학생을 선택해주세요.' });
            return;
        }

        try {
            const res = await showConfirm({
                header: '학생 입원 처리',
                message: `${selectedStudents.length}명의 학생을 입원 처리하시겠습니까?`
            });
            if (!res) return;

            // 선택된 학생들의 isWithdrawn을 false로 업데이트
            const updatePromises = selectedStudents
                .filter((student) => student.studentId)
                .map((student) =>
                    http.post('/choiMath/student/updateStudent', {
                        studentId: student.studentId,
                        isWithdrawn: false
                    })
                );

            await Promise.all(updatePromises);
            showToast({
                severity: 'success',
                summary: '입원 처리 성공',
                detail: `${selectedStudents.length}명의 학생이 입원 처리되었습니다.`
            });
            setSelectedStudents([]);
            fetchStudents();
        } catch (error: any) {
            console.error('Error enrolling students:', error);
            const errorMessage = error.response?.data?.message || error.message || '입원 처리에 실패했습니다.';
            showToast({ severity: 'error', summary: '입원 처리 실패', detail: errorMessage });
        }
    };

    const handleEnrollStudent = async (student: Student) => {
        const isConfirmed = await showConfirm({
            header: '학생 입원 처리',
            message: `'${student.name}' 학생을 입원 처리하시겠습니까?`
        });

        if (isConfirmed) {
            try {
                await http.post('/choiMath/student/updateStudent', {
                    studentId: student.studentId,
                    isWithdrawn: false
                });
                showToast({
                    severity: 'success',
                    summary: '입원 처리 성공',
                    detail: '학생이 입원 처리되었습니다.'
                });
                fetchStudents();
            } catch (error: any) {
                console.error('Error enrolling student:', error);
                const errorMessage = error.response?.data?.message || error.message || '입원 처리에 실패했습니다.';
                showToast({ severity: 'error', summary: '입원 처리 실패', detail: errorMessage });
            }
        }
    };

    const handleWithdrawStudent = async (student: Student) => {
        const isConfirmed = await showConfirm({
            header: '학생 퇴원 처리',
            message: `'${student.name}' 학생을 퇴원 처리하시겠습니까?`
        });

        if (isConfirmed) {
            try {
                await http.post('/choiMath/student/updateStudent', {
                    studentId: student.studentId,
                    isWithdrawn: true
                });
                showToast({
                    severity: 'success',
                    summary: '퇴원 처리 성공',
                    detail: '학생이 퇴원 처리되었습니다.'
                });
                fetchStudents();
            } catch (error: any) {
                console.error('Error withdrawing student:', error);
                const errorMessage = error.response?.data?.message || error.message || '퇴원 처리에 실패했습니다.';
                showToast({ severity: 'error', summary: '퇴원 처리 실패', detail: errorMessage });
            }
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

    const formatDateTime = (dateValue?: string | Date) => {
        if (!dateValue) return '-';

        let date: Date;
        if (typeof dateValue === 'string') {
            date = new Date(dateValue);
        } else {
            date = dateValue;
        }

        if (isNaN(date.getTime())) return '-';

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}`;
    };

    const registDateBodyTemplate = (rowData: Student) => {
        return formatDate(rowData.registDate);
    };

    const updatedDateBodyTemplate = (rowData: Student) => {
        return formatDateTime(rowData.updatedDate);
    };

    const isWithdrawnBodyTemplate = (rowData: Student) => {
        return rowData.isWithdrawn ? <Tag severity="danger" value="퇴원" /> : <Tag severity="success" value="재학" />;
    };

    const actionBodyTemplate = (rowData: Student) => {
        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-pencil"
                    rounded
                    outlined
                    severity="warning"
                    onClick={() => openEditDialog(rowData)}
                    tooltip="수정"
                    tooltipOptions={{ position: 'top' }}
                />
                {rowData.isWithdrawn ? (
                    <Button
                        icon="pi pi-sign-in"
                        rounded
                        outlined
                        severity="success"
                        onClick={() => handleEnrollStudent(rowData)}
                        tooltip="입원"
                        tooltipOptions={{ position: 'top' }}
                    />
                ) : (
                    <Button
                        icon="pi pi-sign-out"
                        rounded
                        outlined
                        severity="warning"
                        onClick={() => handleWithdrawStudent(rowData)}
                        tooltip="퇴원"
                        tooltipOptions={{ position: 'top' }}
                    />
                )}
                <Button
                    icon="pi pi-trash"
                    rounded
                    outlined
                    severity="danger"
                    onClick={() => handleDeleteStudent(rowData.studentId!, rowData.name)}
                    tooltip="삭제"
                    tooltipOptions={{ position: 'top' }}
                />
            </div>
        );
    };

    const rowExpansionTemplate = (rowData: Student) => {
        return (
            <div className="p-3">
                <div className="flex align-items-center justify-content-between mb-3">
                    <h5 className="m-0">수강 중인 수업</h5>
                    <Tag value={`총 ${rowData.classes?.length || 0}개`} severity="info" />
                </div>
                {rowData.classes && rowData.classes.length > 0 ? (
                    <div className="grid">
                        {rowData.classes.map((classItem, index) => (
                            <div key={classItem.classId || index} className="col-12 md:col-6 lg:col-4">
                                <div className="surface-card border-round p-3 shadow-1">
                                    <div className="flex align-items-center gap-2 mb-2">
                                        <i className="pi pi-book text-primary"></i>
                                        <span className="font-semibold text-lg">{classItem.className}</span>
                                    </div>
                                    <div className="flex flex-column gap-1">
                                        <div className="flex align-items-center gap-2">
                                            <span className="text-500 text-sm">선생님:</span>
                                            <span className="text-900">{classItem.teacher}</span>
                                        </div>
                                        {classItem.startDate && (
                                            <div className="flex align-items-center gap-2">
                                                <span className="text-500 text-sm">개강일:</span>
                                                <span className="text-900">{formatDate(classItem.startDate)}</span>
                                            </div>
                                        )}
                                        {classItem.endDate && (
                                            <div className="flex align-items-center gap-2">
                                                <span className="text-500 text-sm">종강일:</span>
                                                <span className="text-900">{formatDate(classItem.endDate)}</span>
                                            </div>
                                        )}
                                        {classItem.description && (
                                            <div className="flex align-items-start gap-2 mt-2">
                                                <span className="text-500 text-sm">설명:</span>
                                                <span className="text-900">{classItem.description}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-500">수강 중인 수업이 없습니다.</div>
                )}
            </div>
        );
    };

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl text-900 font-bold">학생 목록 (총 {students.length}명)</span>
            <div className="flex gap-2">
                <Button
                    icon="pi pi-plus"
                    rounded
                    raised
                    label="신규"
                    onClick={openNewStudentDialog}
                    className="p-button-info"
                />
                <Button
                    icon="pi pi-sign-in"
                    rounded
                    raised
                    label="입원"
                    onClick={handleEnrollStudents}
                    className="p-button-success"
                    disabled={selectedStudents.length === 0}
                />
                <Button
                    icon="pi pi-sign-out"
                    rounded
                    raised
                    label="퇴원"
                    onClick={handleWithdrawStudents}
                    className="p-button-warning"
                    disabled={selectedStudents.length === 0}
                />
                <Button
                    icon="pi pi-trash"
                    rounded
                    raised
                    label="삭제"
                    onClick={handleDeleteStudents}
                    className="p-button-danger"
                    disabled={selectedStudents.length === 0}
                />
                <Button
                    icon="pi pi-search"
                    rounded
                    raised
                    label="조회"
                    onClick={fetchStudents}
                    className="p-button-success"
                />
            </div>
        </div>
    );

    return (
        <div className="card">
            <h1>학생 목록 </h1>
            <DataTable
                value={students}
                header={header}
                paginator
                rows={10}
                emptyMessage="학생을 찾을 수 없습니다."
                selection={selectedStudents}
                onSelectionChange={(e) => setSelectedStudents(e.value as Student[])}
                dataKey="studentId"
                selectionMode="checkbox"
                expandedRows={expandedRows}
                onRowToggle={(e) => setExpandedRows(e.data)}
                rowExpansionTemplate={rowExpansionTemplate}
            >
                <Column expander style={{ width: '3rem' }} />
                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
                <Column field="studentId" header="학생 ID" sortable filter hidden></Column>
                <Column field="name" header="이름" sortable filter></Column>
                <Column field="grade" header="학년" sortable filter></Column>
                <Column field="school" header="학교" sortable filter></Column>
                <Column field="description" header="설명" sortable filter></Column>
                <Column field="registDate" header="입원일자" sortable filter body={registDateBodyTemplate}></Column>
                <Column field="updatedDate" header="수정일자" sortable filter body={updatedDateBodyTemplate}></Column>
                <Column field="isWithdrawn" header="상태" sortable filter body={isWithdrawnBodyTemplate}></Column>
                <Column body={actionBodyTemplate} header="작업" headerStyle={{ minWidth: '12rem' }}></Column>
            </DataTable>
        </div>
    );
};

export default StudentListPage;
