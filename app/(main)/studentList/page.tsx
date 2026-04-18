'use client';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { Student } from '@/components/modals/StudentModal';
import { useCustomModal } from '@/hooks/useCustomModal';
import { useConfirm } from '@/hooks/useConfirm';
import * as XLSX from 'xlsx';

const StudentListPage = () => {
    const { openModal } = useCustomModal();
    const { showConfirm } = useConfirm();
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
    const [expandedRows, setExpandedRows] = useState<any>({});
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const http = useHttp();
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const fetchStudents = async () => {
        try {
            const response = await http.get('/choiMath/student/getStudentList');
            setStudents(response.data || []);
        } catch (error) {
            console.error('Error fetching students:', error);
            showToast({ severity: 'error', summary: '조회 실패', detail: '학생 목록을 불러오는데 실패했습니다.' });
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const exportToExcel = () => {
        let dataToExport = students.length > 0 ? students : [];
        if (dataToExport.length === 0) return;

        const excelData = dataToExport.map((s) => ({
            이름: s.name,
            학년: s.grade,
            학교: s.school,
            학생전화번호: s.phoneNumber || '',
            학부모전화번호: s.parentPhoneNumber || '',
            설명: s.description || '',
            '등록일자(YYYYMMDD)': s.registDate || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
        XLSX.writeFile(workbook, `학생목록_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws) as any[];

                const studentsToSave = data
                    .map((item) => ({
                        name: item['이름']?.toString() || '',
                        grade: item['학년']?.toString() || '',
                        school: item['학교']?.toString() || '',
                        phoneNumber: item['학생전화번호']?.toString().replace(/[^0-9]/g, '') || '',
                        parentPhoneNumber: item['학부모전화번호']?.toString().replace(/[^0-9]/g, '') || '',
                        description: item['설명']?.toString() || '',
                        registDate:
                            item['등록일자(YYYYMMDD)']?.toString() ||
                            new Date().toISOString().split('T')[0].replace(/-/g, ''),
                        isWithdrawn: false
                    }))
                    .filter((s) => s.name && s.grade && s.school);

                if (studentsToSave.length > 0) {
                    const res = await showConfirm({
                        header: '엑셀 업로드',
                        message: `${studentsToSave.length}명의 학생을 등록하시겠습니까?`
                    });
                    if (res) {
                        await http.post('/choiMath/student/saveStudent', { data: studentsToSave });
                        showToast({ severity: 'success', summary: '성공', detail: '등록되었습니다.' });
                        fetchStudents();
                    }
                }
            } catch (error) {
                showToast({ severity: 'error', summary: '실패', detail: '엑셀 처리 중 오류가 발생했습니다.' });
            } finally {
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsBinaryString(file);
    };

    const openEditDialog = async (student: Student) => {
        const result = await openModal({ id: 'student', pData: { mode: 'edit', student } });
        if (result) fetchStudents();
    };

    const openNewStudentDialog = async () => {
        const result = await openModal({ id: 'student', pData: { mode: 'new' } });
        if (result) fetchStudents();
    };

    const handleDeleteStudent = async (studentId: string, name: string) => {
        const isConfirmed = await showConfirm({ header: '삭제', message: `'${name}' 학생을 삭제하시겠습니까?` });
        if (isConfirmed) {
            await http.post('/choiMath/student/deleteStudent', { studentId });
            fetchStudents();
        }
    };

    const handleResetPassword = async (student: Student) => {
        const isConfirmed = await showConfirm({
            header: '비밀번호 초기화',
            message: `'${student.name}' 학생의 비밀번호를 초기화하시겠습니까?`
        });

        if (isConfirmed) {
            try {
                await http.post('/choiMath/student/resetPassword', {
                    studentId: student.studentId
                });
                showToast({ severity: 'success', summary: '성공', detail: '비밀번호가 초기화되었습니다.' });
                fetchStudents();
            } catch (error) {
                showToast({ severity: 'error', summary: '실패', detail: '초기화에 실패했습니다.' });
            }
        }
    };

    const handleResetParentPassword = async (student: Student) => {
        const isConfirmed = await showConfirm({
            header: '학부모 비밀번호 초기화',
            message: `'${student.name}' 학생의 학부모 비밀번호를 초기화하시겠습니까?`
        });

        if (isConfirmed) {
            try {
                await http.post('/choiMath/student/resetPassword', {
                    studentId: student.studentId,
                    target: 'parent'
                });
                showToast({ severity: 'success', summary: '성공', detail: '학부모 비밀번호가 초기화되었습니다.' });
                fetchStudents();
            } catch (error) {
                showToast({ severity: 'error', summary: '실패', detail: '초기화에 실패했습니다.' });
            }
        }
    };

    const handleEnrollStudent = async (student: Student) => {
        const res = await showConfirm({ header: '입원', message: '입원 처리하시겠습니까?' });
        if (res) {
            await http.post('/choiMath/student/updateStudent', { studentId: student.studentId, isWithdrawn: false });
            fetchStudents();
        }
    };

    const handleWithdrawStudent = async (student: Student) => {
        const res = await showConfirm({ header: '퇴원', message: '퇴원 처리하시겠습니까?' });
        if (res) {
            await http.post('/choiMath/student/updateStudent', { studentId: student.studentId, isWithdrawn: true });
            fetchStudents();
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString || dateString.length !== 8) return '-';
        return `${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}`;
    };

    const nameBodyTemplate = (rowData: Student) => (
        <span className="text-primary font-bold cursor-pointer hover:underline" onClick={() => openEditDialog(rowData)}>
            {rowData.name}
        </span>
    );

    const isWithdrawnBodyTemplate = (rowData: Student) =>
        rowData.isWithdrawn ? <Tag severity="danger" value="퇴원" /> : <Tag severity="success" value="재학" />;

    const actionBodyTemplate = (rowData: Student) => (
        <div className="flex gap-2">
            <Button
                icon="pi pi-pencil"
                rounded
                outlined
                severity="warning"
                onClick={() => openEditDialog(rowData)}
                tooltip="수정"
            />
            <Button
                icon="pi pi-key"
                rounded
                outlined
                severity="help"
                onClick={() => handleResetPassword(rowData)}
                tooltip="학생 비밀번호 초기화"
            />
            <Button
                icon="pi pi-key"
                rounded
                outlined
                severity="warning"
                onClick={() => handleResetParentPassword(rowData)}
                tooltip="학부모 비밀번호 초기화"
            />
            {rowData.isWithdrawn ? (
                <Button
                    icon="pi pi-sign-in"
                    rounded
                    outlined
                    severity="success"
                    onClick={() => handleEnrollStudent(rowData)}
                    tooltip="입원"
                />
            ) : (
                <Button
                    icon="pi pi-sign-out"
                    rounded
                    outlined
                    severity="warning"
                    onClick={() => handleWithdrawStudent(rowData)}
                    tooltip="퇴원"
                />
            )}
            <Button
                icon="pi pi-trash"
                rounded
                outlined
                severity="danger"
                onClick={() => handleDeleteStudent(rowData.studentId!, rowData.name)}
                tooltip="삭제"
            />
        </div>
    );

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <div className="flex align-items-center gap-3">
                <span className="text-xl text-900 font-bold">학생 목록 ({students.length}명)</span>
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText
                        value={globalFilterValue}
                        onChange={onGlobalFilterChange}
                        placeholder="검색어를 입력하세요"
                        className="p-inputtext-sm"
                    />
                </span>
            </div>
            <div className="flex gap-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".xlsx, .xls"
                    onChange={handleImportExcel}
                />
                <Button
                    icon="pi pi-file-excel"
                    rounded
                    raised
                    label="업로드"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-button-help"
                />
                <Button
                    icon="pi pi-download"
                    rounded
                    raised
                    label="다운로드"
                    onClick={exportToExcel}
                    className="p-button-secondary"
                />
                <Button
                    icon="pi pi-plus"
                    rounded
                    raised
                    label="신규"
                    onClick={openNewStudentDialog}
                    className="p-button-info"
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
            <h1>학생 목록</h1>
            <DataTable
                showGridlines
                value={students}
                header={header}
                paginator
                rows={10}
                filters={filters}
                globalFilterFields={['name', 'grade', 'school', 'phoneNumber', 'parentPhoneNumber']}
                emptyMessage="학생을 찾을 수 없습니다."
                dataKey="studentId"
                expandedRows={expandedRows}
                onRowToggle={(e) => setExpandedRows(e.data)}
                rowExpansionTemplate={(rowData) => (
                    <div className="p-3">
                        <h5 className="m-0 mb-3">수강 중인 수업 ({rowData.classes?.length || 0})</h5>
                        {rowData.classes && rowData.classes.length > 0 ? (
                            <div className="p-4 bg-bluegray-50 border-round-bottom-xl">
                                {/* 1. 특이 사항(Description) 섹션 */}
                                <div className="surface-card p-3 mb-4 shadow-1 border-round border-left-3 border-blue-500">
                                    <div className="flex align-items-center mb-2">
                                        <i className="pi pi-info-circle text-blue-500 mr-2 font-bold" />
                                        <span className="font-bold text-900">특이 사항</span>
                                    </div>
                                    <div className="text-700 line-height-3 pl-1">
                                        {rowData?.description ? (
                                            rowData?.description
                                        ) : (
                                            <span className="text-400 italic">등록된 특이 사항이 없습니다.</span>
                                        )}
                                    </div>
                                </div>

                                {/* 2. 수업 목록 섹션 */}
                                <div className="mb-2 flex align-items-center justify-content-between">
                                    <h5 className="m-0 font-bold text-800">
                                        <i className="pi pi-calendar-plus mr-2" />
                                        수강 중인 수업 ({rowData.classes?.length || 0})
                                    </h5>
                                </div>

                                {rowData.classes && rowData.classes.length > 0 ? (
                                    <div className="grid">
                                        {rowData.classes.map((c, i) => (
                                            <div key={i} className="col-12 md:col-6 lg:col-4">
                                                <div className="surface-card border-round-xl p-3 shadow-1 border-1 border-50 hover:shadow-3 transition-duration-200">
                                                    <div className="flex justify-content-between align-items-start mb-2">
                                                        <div className="flex align-items-center">
                                                            <div className="bg-blue-100 border-round p-2 mr-2">
                                                                <i className="pi pi-book text-blue-700" />
                                                            </div>
                                                            <span className="font-semibold text-900">
                                                                {c.className}
                                                            </span>
                                                        </div>
                                                        {/* 필요 시 우측 상단에 배지 등 추가 가능 */}
                                                    </div>
                                                    <div className="text-sm text-600 ml-1">
                                                        <i className="pi pi-user text-xs mr-1" />
                                                        선생님:{' '}
                                                        <span className="text-800 font-medium">{c.teacher}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="surface-ground border-round p-4 text-center">
                                        <i className="pi pi-folder-open text-300 text-3xl mb-2" />
                                        <div className="text-500">수업 정보가 없습니다.</div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-500">수업 정보가 없습니다.</div>
                        )}
                    </div>
                )}
            >
                <Column expander style={{ width: '3rem' }} />
                <Column
                    field="name"
                    header="이름"
                    headerStyle={{ minWidth: '100px' }}
                    sortable
                    body={nameBodyTemplate}
                />
                <Column
                    field="grade"
                    header="학년"
                    sortable
                    headerStyle={{ minWidth: '100px' }}
                    alignHeader={'center'}
                    align={'center'}
                />
                <Column field="school" header="학교" sortable headerStyle={{ minWidth: '150px' }} />
                <Column field="phoneNumber" header="Tel." sortable headerStyle={{ minWidth: '150px' }} />
                <Column field="parentPhoneNumber" header="P_Tel." sortable headerStyle={{ minWidth: '150px' }} />
                <Column field="isWithdrawn" header="상태" sortable body={isWithdrawnBodyTemplate} />
                <Column body={actionBodyTemplate} header="작업" headerStyle={{ minWidth: '12rem' }} />
            </DataTable>
        </div>
    );
};

export default StudentListPage;
