'use client';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { useState, useEffect } from 'react';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { Student } from './StudentModal';
import { Student as ClassStudent } from '@/types/class';

interface StudentSelectModalProps {
    visible: boolean;
    pData?: {
        selectedStudents?: ClassStudent[];
    };
    onClose: (result?: ClassStudent[] | null) => void;
}

const StudentSelectModal = ({ visible, pData, onClose }: StudentSelectModalProps) => {
    const http = useHttp();
    const { showToast } = useToast();
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudentObjects, setSelectedStudentObjects] = useState<Student[]>([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            fetchStudents();
            setSearchText('');
        }
    }, [visible]);

    useEffect(() => {
        if (visible && students.length > 0 && pData?.selectedStudents) {
            // 이미 선택된 학생들을 Student 객체로 변환
            const selected = students.filter((student) =>
                pData.selectedStudents?.some((s) => 
                    (s.studentId === student.studentId) 
                )
            );
            setSelectedStudentObjects(selected);
        } else if (visible && students.length > 0 && !pData?.selectedStudents) {
            setSelectedStudentObjects([]);
        }
    }, [visible, students, pData]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await http.get('/choiMath/student/getStudentList');
            // 입원한 학생만 필터링 (isWithdrawn이 false이거나 undefined인 경우)
            const enrolledStudents = (response.data || []).filter(
                (student: Student) => !student.isWithdrawn
            );
            setStudents(enrolledStudents);
        } catch (error) {
            console.error('Error fetching students:', error);
            showToast({ severity: 'error', summary: '조회 실패', detail: '학생 목록을 불러오는데 실패했습니다.' });
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter((student) => {
        const searchLower = searchText.toLowerCase();
        return (
            student.name.toLowerCase().includes(searchLower) ||
            student.studentId?.toLowerCase().includes(searchLower) ||
            student.school?.toLowerCase().includes(searchLower) ||
            student.grade?.toLowerCase().includes(searchLower) ||
            student.description?.toLowerCase().includes(searchLower)
        );
    });

    const handleConfirm = () => {
        const classStudents: ClassStudent[] = selectedStudentObjects.map((student) => ({
            studentId: student.studentId,
            name: student.name,
            grade: student.grade,
            school: student.school,
            description: student.description,
            registDate: student.registDate,
            updatedDate: student.updatedDate,
            isWithdrawn: student.isWithdrawn
        }));
        onClose(classStudents);
    };

    const handleCancel = () => {
        onClose(null);
    };

    const handleSelectionChange = (e: any) => {
        setSelectedStudentObjects(e.value as Student[]);
    };

    const dialogFooter = (
        <div>
            <Button label="취소" icon="pi pi-times" onClick={handleCancel} className="p-button-text" />
            <Button label="확인" icon="pi pi-check" onClick={handleConfirm} />
        </div>
    );

    return (
        <Dialog
            visible={visible}
            style={{ width: '800px' }}
            header="학생 선택"
            modal
            className="p-fluid"
            footer={dialogFooter}
            onHide={handleCancel}
        >
            <div className="field mb-3">
                <InputText
                    placeholder="이름, ID, 학교, 학년, 설명으로 검색..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full"
                />
            </div>
            <div className="field">
                <small className="text-500">선택된 학생: {selectedStudentObjects.length}명</small>
            </div>
            <DataTable
                value={filteredStudents}
                loading={loading}
                paginator
                rows={10}
                emptyMessage="입원한 학생을 찾을 수 없습니다."
                selection={selectedStudentObjects}
                onSelectionChange={handleSelectionChange}
                dataKey="studentId"
                selectionMode="checkbox"
            >
                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
                <Column field="name" header="이름" sortable></Column>
                <Column field="grade" header="학년" sortable></Column>
                <Column field="school" header="학교" sortable></Column>
                <Column field="description" header="설명" sortable></Column>
            </DataTable>
        </Dialog>
    );
};

export default StudentSelectModal;
