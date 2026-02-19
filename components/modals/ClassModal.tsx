'use client';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Chip } from 'primereact/chip';
import { useState, useEffect } from 'react';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { Class, Student } from '@/types/class';
import { useCustomModal } from '@/hooks/useCustomModal';

interface ClassModalProps {
    visible: boolean;
    pData?: {
        mode?: 'edit' | 'new';
        class?: Class;
    };
    onClose: (result?: Class | null) => void;
}

const ClassModal = ({ visible, pData, onClose }: ClassModalProps) => {
    const mode = pData?.mode || 'new';
    const initialClass = pData?.class;

    const http = useHttp();
    const { showToast } = useToast();
    const { openModal } = useCustomModal();

    const [classData, setClassData] = useState<Class>({
        classId: '',
        className: '',
        teacher: '',
        students: [],
        description: '',
        startDate: '',
        endDate: '',
        isClosed: false
    });
    const [startDateValue, setStartDateValue] = useState<Date | null>(null);
    const [endDateValue, setEndDateValue] = useState<Date | null>(null);
    const [submitted, setSubmitted] = useState(false);

    // YYYYMMDD 형식을 Date 객체로 변환
    const parseDate = (dateString?: string): Date | null => {
        if (!dateString || dateString.length !== 8) return null;
        const year = parseInt(dateString.substring(0, 4));
        const month = parseInt(dateString.substring(4, 6)) - 1;
        const day = parseInt(dateString.substring(6, 8));
        return new Date(year, month, day);
    };

    // Date 객체를 YYYYMMDD 형식으로 변환
    const formatDate = (date: Date | null): string => {
        if (!date) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    };

    useEffect(() => {
        if (visible) {
            if (mode === 'edit' && initialClass) {
                setClassData({ ...initialClass });
                setStartDateValue(parseDate(initialClass.startDate));
                setEndDateValue(parseDate(initialClass.endDate));
            } else {
                setClassData({
                    classId: '',
                    className: '',
                    teacher: '',
                    students: [],
                    description: '',
                    startDate: '',
                    endDate: '',
                    isClosed: false
                });
                setStartDateValue(null);
                setEndDateValue(null);
            }
            setSubmitted(false);
        }
    }, [visible, mode, initialClass]);

    const handleOpenStudentSelect = async () => {
        try {
            const result = await openModal({
                id: 'studentSelect',
                pData: {
                    selectedStudents: classData.students
                }
            });
            if (result) {
                setClassData({ ...classData, students: result });
            }
        } catch (error) {
            console.error('Error opening student select modal:', error);
        }
    };

    const handleRemoveStudent = (userId: string) => {
        setClassData({
            ...classData,
            students: classData.students.filter((s) => (s.userId || s.studentId) !== userId)
        });
    };

    const isEditMode = mode === 'edit';
    const header = isEditMode ? '클래스 수정' : '클래스 등록';
    const saveButtonLabel = isEditMode ? '저장' : '등록';

    const handleSave = async () => {
        setSubmitted(true);

        // Validation
        if (!classData.className || !classData.teacher || !classData.description) {
            showToast({ severity: 'error', summary: '입력 오류', detail: '모든 필수 필드를 입력해주세요.' });
            return;
        }

        try {
            const formattedStartDate = formatDate(startDateValue);
            const formattedEndDate = formatDate(endDateValue);
            
            if (mode === 'new') {
                const payload = {
                    className: classData.className,
                    teacher: classData.teacher,
                    students: classData.students,
                    description: classData.description,
                    startDate: formattedStartDate,
                    endDate: formattedEndDate,
                    isClosed: classData.isClosed || false
                };
                await http.post('/choiMath/class', payload);
                showToast({ severity: 'success', summary: '등록 성공', detail: '클래스 등록에 성공했습니다.' });
            } else {
                const payload = {
                    classId: classData.classId,
                    className: classData.className,
                    teacher: classData.teacher,
                    students: classData.students,
                    description: classData.description,
                    startDate: formattedStartDate,
                    endDate: formattedEndDate,
                    isClosed: classData.isClosed || false
                };
                await http.post('/choiMath/class/update', payload);
                showToast({ severity: 'success', summary: '수정 성공', detail: '클래스 정보가 수정되었습니다.' });
            }
            onClose(classData);
        } catch (error: any) {
            console.error('Error saving class:', error);
            const errorMessage = error.response?.data?.message || error.message || '작업에 실패했습니다.';
            showToast({ severity: 'error', summary: '실패', detail: errorMessage });
        }
    };

    const handleCancel = () => {
        onClose(null);
    };

    const dialogFooter = (
        <div>
            <Button label="취소" icon="pi pi-times" onClick={handleCancel} className="p-button-text" />
            <Button label={saveButtonLabel} icon="pi pi-check" onClick={handleSave} />
        </div>
    );


    return (
        <Dialog
            visible={visible}
            style={{ width: '600px' }}
            header={header}
            modal
            className="p-fluid"
            footer={dialogFooter}
            onHide={handleCancel}
        >
            <div className="field">
                <label htmlFor="className">
                    클래스명 <span className="text-red-500">*</span>
                </label>
                <InputText
                    id="className"
                    value={classData.className}
                    onChange={(e) => setClassData({ ...classData, className: e.target.value })}
                    required
                    className={submitted && !classData.className ? 'p-invalid' : ''}
                />
                {submitted && !classData.className && <small className="p-invalid">클래스명을 입력해주세요.</small>}
            </div>
            <div className="field">
                <label htmlFor="teacher">
                    선생님 <span className="text-red-500">*</span>
                </label>
                <InputText
                    id="teacher"
                    value={classData.teacher}
                    onChange={(e) => setClassData({ ...classData, teacher: e.target.value })}
                    required
                    className={submitted && !classData.teacher ? 'p-invalid' : ''}
                />
                {submitted && !classData.teacher && <small className="p-invalid">선생님을 입력해주세요.</small>}
            </div>
            <div className="field">
                <label htmlFor="students">학생</label>
                <div className="flex flex-column gap-2">
                    <Button
                        label="학생 선택"
                        icon="pi pi-users"
                        onClick={handleOpenStudentSelect}
                        className="p-button-outlined"
                    />
                    {classData.students.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {classData.students.map((student) => (
                                <Chip
                                    key={student.userId || student.studentId}
                                    label={student.userName || student.name || '이름 없음'}
                                    removable
                                    onRemove={() => handleRemoveStudent(student.userId || student.studentId || '')}
                                />
                            ))}
                        </div>
                    )}
                    {classData.students.length === 0 && (
                        <small className="text-500">선택된 학생이 없습니다.</small>
                    )}
                </div>
            </div>
            <div className="field">
                <label htmlFor="description">
                    설명 <span className="text-red-500">*</span>
                </label>
                <InputTextarea
                    id="description"
                    value={classData.description}
                    onChange={(e) => setClassData({ ...classData, description: e.target.value })}
                    required
                    rows={3}
                    cols={20}
                    className={submitted && !classData.description ? 'p-invalid' : ''}
                />
                {submitted && !classData.description && <small className="p-invalid">설명을 입력해주세요.</small>}
            </div>
            <div className="field">
                <label htmlFor="startDate">개강일시</label>
                <Calendar
                    id="startDate"
                    value={startDateValue}
                    onChange={(e) => {
                        setStartDateValue(e.value as Date);
                        setClassData({ ...classData, startDate: formatDate(e.value as Date) });
                    }}
                    dateFormat="yy-mm-dd"
                    showIcon
                    showButtonBar
                />
            </div>
            <div className="field">
                <label htmlFor="endDate">종강일시</label>
                <Calendar
                    id="endDate"
                    value={endDateValue}
                    onChange={(e) => {
                        setEndDateValue(e.value as Date);
                        setClassData({ ...classData, endDate: formatDate(e.value as Date) });
                    }}
                    dateFormat="yy-mm-dd"
                    showIcon
                    showButtonBar
                />
            </div>
            <div className="field">
                <div className="flex align-items-center">
                    <Checkbox
                        inputId="isClosed"
                        checked={classData.isClosed || false}
                        onChange={(e) => setClassData({ ...classData, isClosed: e.checked ?? false })}
                    />
                    <label htmlFor="isClosed" className="ml-2">
                        종강 여부
                    </label>
                </div>
            </div>
        </Dialog>
    );
};

export default ClassModal;
