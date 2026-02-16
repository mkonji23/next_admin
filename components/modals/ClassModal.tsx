'use client';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { MultiSelect } from 'primereact/multiselect';
import { Button } from 'primereact/button';
import { useState, useEffect } from 'react';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { Class, Student } from '@/types/class';
import { User } from './UserModal';

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

    const [classData, setClassData] = useState<Class>({
        classId: '',
        className: '',
        teacher: '',
        students: [],
        description: ''
    });
    const [submitted, setSubmitted] = useState(false);
    const [availableStudents, setAvailableStudents] = useState<Student[]>([]);

    useEffect(() => {
        if (visible) {
            if (mode === 'edit' && initialClass) {
                setClassData({ ...initialClass });
                console.log('initialClass', initialClass);
            } else {
                setClassData({
                    classId: '',
                    className: '',
                    teacher: '',
                    students: [],
                    description: ''
                });
            }
            setSubmitted(false);
            fetchAvailableStudents();
        }
    }, []);

    const fetchAvailableStudents = async () => {
        try {
            const response = await http.get('/choiMath/user/getUserList', { params: { auth: 'student' } }); // Assuming all users can be students
            const students = response.data.map((user: User) => ({
                userId: user.userId,
                userName: user.userName
            }));
            setAvailableStudents(students);
        } catch (error) {
            console.error('Error fetching available students:', error);
            showToast({ severity: 'error', summary: '조회 실패', detail: '학생 목록을 불러오는데 실패했습니다.' });
        }
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
            if (mode === 'new') {
                const payload = {
                    className: classData.className,
                    teacher: classData.teacher,
                    students: classData.students, // Send only userIds
                    description: classData.description
                };
                await http.post('/choiMath/class', payload); // Assuming POST for new class
                showToast({ severity: 'success', summary: '등록 성공', detail: '클래스 등록에 성공했습니다.' });
            } else {
                const payload = {
                    classId: classData.classId,
                    className: classData.className,
                    teacher: classData.teacher,
                    students: classData.students, // Send only userIds
                    description: classData.description
                };
                await http.post('/choiMath/class/update', payload); // Changed to POST for update
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

    const handleClassData = (e: any) => {
        const { value } = e.target;
        setClassData({ ...classData, students: value });
    };

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
                <MultiSelect
                    id="students"
                    value={classData.students}
                    options={availableStudents}
                    optionLabel="userName"
                    placeholder="학생을 선택하세요"
                    onChange={(e) => handleClassData(e)}
                    filter
                    display="chip"
                />
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
        </Dialog>
    );
};

export default ClassModal;
