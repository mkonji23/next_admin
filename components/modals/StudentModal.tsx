'use client';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { useState, useEffect } from 'react';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';

export interface StudentClass {
    classId: string;
    className: string;
    teacher: string;
    startDate?: string;
    endDate?: string;
    description?: string;
}

export interface Student {
    studentId?: string;
    name: string;
    grade: string;
    school: string;
    phoneNumber?: string;
    parentPhoneNumber?: string;
    description?: string;
    registDate?: string;
    updatedDate?: string | Date;
    isWithdrawn?: boolean;
    classes?: StudentClass[];
    simplePassword?: string;
}

interface StudentModalProps {
    visible: boolean;
    pData?: {
        mode?: 'edit' | 'new';
        student?: Student;
    };
    onClose: (result?: Student | null) => void;
}

const StudentModal = ({ visible, pData, onClose }: StudentModalProps) => {
    const mode = pData?.mode || 'new';
    const initialStudent = pData?.student;

    const http = useHttp();
    const { showToast } = useToast();
    const { showConfirm } = useConfirm();

    const [student, setStudent] = useState<Student>({
        name: '',
        grade: '',
        school: '',
        phoneNumber: '',
        parentPhoneNumber: '',
        description: '',
        registDate: '',
        isWithdrawn: false
    });
    const [registDateValue, setRegistDateValue] = useState<Date | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const gradeOptions = [
        { label: '1학년', value: '1' },
        { label: '2학년', value: '2' },
        { label: '3학년', value: '3' }
    ];

    const parseDate = (dateString?: string): Date | null => {
        if (!dateString || dateString.length !== 8) return null;
        const year = parseInt(dateString.substring(0, 4));
        const month = parseInt(dateString.substring(4, 6)) - 1;
        const day = parseInt(dateString.substring(6, 8));
        return new Date(year, month, day);
    };

    const formatDate = (date: Date | null): string => {
        if (!date) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    };

    useEffect(() => {
        if (visible) {
            if (mode === 'edit' && initialStudent) {
                setStudent({ ...initialStudent });
                setRegistDateValue(parseDate(initialStudent.registDate));
            } else {
                const today = new Date();
                setStudent({
                    name: '',
                    grade: '',
                    school: '',
                    phoneNumber: '',
                    parentPhoneNumber: '',
                    description: '',
                    registDate: formatDate(today),
                    isWithdrawn: false
                });
                setRegistDateValue(today);
            }
            setSubmitted(false);
        }
    }, [visible, mode, initialStudent]);

    const isEditMode = mode === 'edit';
    const header = isEditMode ? '학생 수정' : '학생 등록';
    const saveButtonLabel = isEditMode ? '저장' : '등록';

    const handleResetPassword = async () => {
        if (!student.studentId) return;

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
            } catch (error) {
                showToast({ severity: 'error', summary: '실패', detail: '초기화에 실패했습니다.' });
            }
        }
    };

    const handleSave = async () => {
        setSubmitted(true);

        if (!student.name || !student.grade || !student.school) {
            showToast({ severity: 'error', summary: '입력 오류', detail: '이름, 학년, 학교는 필수 입력 항목입니다.' });
            return;
        }

        try {
            const formattedRegistDate = formatDate(registDateValue);

            if (mode === 'new') {
                const names = student.name.split(',').map((name) => name.trim()).filter((name) => name.length > 0);
                if (names.length === 0) {
                    showToast({ severity: 'error', summary: '입력 오류', detail: '이름을 입력해주세요.' });
                    return;
                }

                const studentsData = names.map((name) => ({
                    name: name,
                    grade: student.grade,
                    school: student.school,
                    phoneNumber: student.phoneNumber || '',
                    parentPhoneNumber: student.parentPhoneNumber || '',
                    description: student.description || '',
                    registDate: formattedRegistDate,
                    isWithdrawn: false
                }));

                await http.post('/choiMath/student/saveStudent', { data: studentsData.length === 1 ? studentsData[0] : studentsData });
                showToast({ severity: 'success', summary: '등록 성공', detail: '등록되었습니다.' });
            } else {
                const payload: Student = {
                    studentId: student.studentId,
                    name: student.name,
                    grade: student.grade,
                    school: student.school,
                    phoneNumber: student.phoneNumber || '',
                    parentPhoneNumber: student.parentPhoneNumber || '',
                    description: student.description || '',
                    registDate: formattedRegistDate,
                    isWithdrawn: student.isWithdrawn || false
                };

                await http.post('/choiMath/student/updateStudent', payload);
                showToast({ severity: 'success', summary: '수정 성공', detail: '학생 정보가 수정되었습니다.' });
            }
            onClose(student);
        } catch (error: any) {
            console.error('Error saving student:', error);
            showToast({ severity: 'error', summary: '실패', detail: '작업에 실패했습니다.' });
        }
    };

    const handleCancel = () => onClose(null);

    const dialogFooter = (
        <div>
            <Button label="취소" icon="pi pi-times" onClick={handleCancel} className="p-button-text" />
            <Button label={saveButtonLabel} icon="pi pi-check" onClick={handleSave} />
        </div>
    );

    return (
        <Dialog visible={visible} style={{ width: '550px' }} header={header} modal className="p-fluid" footer={dialogFooter} onHide={handleCancel}>
            <div className="field">
                <label htmlFor="name">이름 <span className="text-red-500">*</span>{!isEditMode && <small className="text-500 ml-2">(쉼표 구분 가능)</small>}</label>
                <InputText id="name" value={student.name} onChange={(e) => setStudent({ ...student, name: e.target.value })} required className={submitted && !student.name ? 'p-invalid' : ''} />
            </div>
            <div className="field">
                <label htmlFor="grade">학년 <span className="text-red-500">*</span></label>
                <Dropdown id="grade" value={student.grade} options={gradeOptions} onChange={(e) => setStudent({ ...student, grade: e.value })} placeholder="학년 선택" className={submitted && !student.grade ? 'p-invalid' : ''} />
            </div>
            <div className="field">
                <label htmlFor="school">학교 <span className="text-red-500">*</span></label>
                <InputText id="school" value={student.school} onChange={(e) => setStudent({ ...student, school: e.target.value })} required className={submitted && !student.school ? 'p-invalid' : ''} />
            </div>
            <div className="field">
                <label htmlFor="phoneNumber">학생 전화번호</label>
                <InputText id="phoneNumber" value={student.phoneNumber || ''} onChange={(e) => setStudent({ ...student, phoneNumber: e.target.value })} placeholder="010-0000-0000" />
            </div>
            <div className="field">
                <label htmlFor="parentPhoneNumber">학부모 전화번호</label>
                <InputText id="parentPhoneNumber" value={student.parentPhoneNumber || ''} onChange={(e) => setStudent({ ...student, parentPhoneNumber: e.target.value })} placeholder="010-0000-0000" />
            </div>
            {isEditMode && (
                <div className="field">
                    <label>간편 비밀번호</label>
                    <div>
                        <Button type="button" label="비밀번호 초기화" icon="pi pi-key" className="p-button-outlined p-button-help" onClick={handleResetPassword} />
                    </div>
                </div>
            )}
            <div className="field">
                <label htmlFor="description">설명</label>
                <InputTextarea id="description" value={student.description || ''} onChange={(e) => setStudent({ ...student, description: e.target.value })} rows={5} autoResize />
            </div>
            <div className="field">
                <label htmlFor="registDate">등록일자</label>
                <Calendar id="registDate" value={registDateValue} onChange={(e) => { setRegistDateValue(e.value as Date); setStudent({ ...student, registDate: formatDate(e.value as Date) }); }} dateFormat="yy-mm-dd" showIcon showButtonBar locale="ko" />
            </div>
            {isEditMode && (
                <div className="field">
                    <div className="flex align-items-center">
                        <Checkbox inputId="isWithdrawn" checked={student.isWithdrawn || false} onChange={(e) => setStudent({ ...student, isWithdrawn: e.checked ?? false })} />
                        <label htmlFor="isWithdrawn" className="ml-2">퇴원 여부</label>
                    </div>
                </div>
            )}
        </Dialog>
    );
};

export default StudentModal;
