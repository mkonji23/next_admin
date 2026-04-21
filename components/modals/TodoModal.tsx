'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { MultiSelect } from 'primereact/multiselect';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { Todo, TodoUser, TodoStatus } from '@/types/todo';
import dayjs from 'dayjs';
import { CustomEditor } from '../editor/CustomEditor';
import { STATUS_LABELS, CATEGORY_OPTIONS } from '@/constants/todo';

interface TodoModalProps {
    visible: boolean;
    pData?: {
        mode?: 'edit' | 'new';
        todo?: Todo;
        initialDate?: Date;
    };
    onClose: (result?: Todo | Todo[] | null) => void;
}

const TodoModal = ({ visible, pData, onClose }: TodoModalProps) => {
    const mode = pData?.mode || 'new';
    const initialTodo = pData?.todo;
    const initialDate = pData?.initialDate || new Date();

    const http = useHttp();
    const { showToast } = useToast();

    const [todo, setTodo] = useState<Partial<Todo>>({
        title: '',
        category: 'OTHER',
        startDate: initialDate,
        endDate: initialDate,
        status: 'PENDING',
        delayedReason: '',
        assignees: [],
        content: '',
        isCompleted: false
    });
    const [users, setUsers] = useState<TodoUser[]>([]);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await http.get('/choiMath/user/getUserList');
                const userList = response.data
                    .filter((u: any) => u.userId && u.userName)
                    .map((u: any) => ({
                        userId: u.userId,
                        userName: u.userName
                    }));
                setUsers(userList);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        if (visible) {
            fetchUsers();
            if (mode === 'edit' && initialTodo) {
                setTodo({
                    ...initialTodo,
                    startDate: dayjs(initialTodo.startDate).toDate(),
                    endDate: dayjs(initialTodo.endDate).toDate()
                });
            } else {
                setTodo({
                    title: '제목없음',
                    category: 'OTHER',
                    startDate: initialDate,
                    endDate: initialDate,
                    status: 'PENDING',
                    delayedReason: '',
                    assignees: [],
                    content: '',
                    isCompleted: false
                });
            }
            setSubmitted(false);
        }
    }, [visible, mode]);

    const handleSave = async (action: 'save' | 'complete' = 'save') => {
        setSubmitted(true);

        if (
            !todo.title ||
            !todo.startDate ||
            !todo.endDate ||
            !todo.content ||
            !todo.assignees ||
            todo.assignees.length === 0
        ) {
            showToast({ severity: 'error', summary: '입력 오류', detail: '필수 항목을 모두 입력해주세요.' });
            return;
        }

        try {
            const isCompletedValue = action === 'complete' ? true : todo.isCompleted ?? false;
            const statusValue = action === 'complete' ? 'COMPLETED' : todo.status || 'PENDING';

            const basePayload: Omit<Todo, 'id' | 'assignees'> = {
                title: todo.title || '',
                category: todo.category || 'OTHER',
                startDate: dayjs(todo.startDate).format('YYYYMMDD'),
                endDate: dayjs(todo.endDate).format('YYYYMMDD'),
                status: statusValue as TodoStatus,
                delayedReason: todo.delayedReason || '',
                content: todo.content || '',
                delta: todo.delta || [],
                isCompleted: isCompletedValue
            };

            const payload: Todo = {
                ...basePayload,
                id: todo.id || '',
                assignees: todo.assignees || []
            };

            if (mode === 'new') {
                const response = await http.post('/choiMath/todo/createTodo', payload);
                showToast({
                    severity: 'success',
                    summary: '등록 성공',
                    detail: '할 일이 등록되었습니다.'
                });
                onClose({ ...payload, id: response.data.data.id });
            } else {
                await http.post('/choiMath/todo/updateTodo', payload);
                showToast({
                    severity: 'success',
                    summary: '수정 성공',
                    detail: action === 'complete' ? '업무가 완료되었습니다.' : '할 일이 수정되었습니다.'
                });
                onClose(payload);
            }
        } catch (error: any) {
            console.error('Error saving todo:', error);
            showToast({
                severity: 'error',
                summary: '실패',
                detail: error.response?.data?.message || '작업에 실패했습니다.'
            });
        }
    };

    const dialogFooter = (
        <div className="flex justify-content-end gap-2">
            {mode === 'edit' ? (
                <>
                    {todo.status !== 'COMPLETED' && (
                        <Button
                            label="완료"
                            icon="pi pi-check-circle"
                            onClick={() => handleSave('complete')}
                            className="p-button-success"
                            style={{ marginRight: 'auto' }}
                        />
                    )}
                    <Button
                        label="저장"
                        icon="pi pi-save"
                        onClick={() => handleSave('save')}
                        className="p-button-warning"
                    />
                    <Button label="취소" icon="pi pi-times" onClick={() => onClose()} className="p-button-text" />
                </>
            ) : (
                <>
                    <Button label="저장" icon="pi pi-save" onClick={() => handleSave('save')} />
                    <Button label="취소" icon="pi pi-times" onClick={() => onClose(null)} className="p-button-text" />
                </>
            )}
        </div>
    );

    return (
        <Dialog
            visible={visible}
            style={{ width: '800px' }}
            header={mode === 'edit' ? '할 일 수정' : '신규 할 일'}
            modal
            blockScroll
            className="p-fluid"
            footer={dialogFooter}
            onHide={() => onClose(null)}
        >
            <div className="grid">
                <div className="field col-12">
                    <label htmlFor="title">
                        업무 제목 <span className="text-red-500">*</span>
                    </label>
                    <InputText
                        id="title"
                        value={todo.title || ''}
                        onChange={(e) => setTodo({ ...todo, title: e.target.value })}
                        placeholder="업무 제목을 입력하세요"
                        className={submitted && !todo.title ? 'p-invalid' : ''}
                    />
                </div>

                <div className="field col-12 md:col-6">
                    <label htmlFor="category">업무 구분</label>
                    <Dropdown
                        id="category"
                        value={todo.category}
                        options={CATEGORY_OPTIONS}
                        onChange={(e) => setTodo({ ...todo, category: e.value })}
                        placeholder="구분 선택"
                    />
                </div>

                <div className="field col-12 md:col-6">
                    <label htmlFor="status">상태</label>
                    <InputText id="status" value={STATUS_LABELS[todo.status || 'PENDING']} disabled />
                </div>

                {todo.status === 'HOLD' && (
                    <div className="field col-12">
                        <label htmlFor="delayedReason">지연 사유</label>
                        <InputText
                            id="delayedReason"
                            value={todo.delayedReason || ''}
                            onChange={(e) => setTodo({ ...todo, delayedReason: e.target.value })}
                            placeholder="지연 사유를 입력하세요"
                        />
                    </div>
                )}

                <div className="field col-12 md:col-6">
                    <label htmlFor="startDate">
                        시작 일자 <span className="text-red-500">*</span>
                    </label>
                    <Calendar
                        id="startDate"
                        value={todo.startDate as Date}
                        onChange={(e) => setTodo({ ...todo, startDate: e.value as Date })}
                        showIcon
                        dateFormat="yy-mm-dd"
                        className={submitted && !todo.startDate ? 'p-invalid' : ''}
                        locale="ko"
                        appendTo={'self'}
                    />
                </div>

                <div className="field col-12 md:col-6">
                    <label htmlFor="endDate">
                        종료 일자 <span className="text-red-500">*</span>
                    </label>
                    <Calendar
                        id="endDate"
                        value={todo.endDate as Date}
                        onChange={(e) => setTodo({ ...todo, endDate: e.value as Date })}
                        showIcon
                        dateFormat="yy-mm-dd"
                        className={submitted && !todo.endDate ? 'p-invalid' : ''}
                        locale="ko"
                        appendTo={'self'}
                    />
                </div>

                <div className="field col-12">
                    <label htmlFor="assignees">
                        담당자
                        <span className="text-red-500"> *</span>
                    </label>
                    <MultiSelect
                        id="assignees"
                        value={todo.assignees}
                        options={users}
                        optionLabel="userName"
                        dataKey="userId"
                        onChange={(e) => setTodo({ ...todo, assignees: e.value })}
                        placeholder="담당자를 선택하세요"
                        display="chip"
                        className={submitted && (!todo.assignees || todo.assignees.length === 0) ? 'p-invalid' : ''}
                    />
                </div>

                <div className="field col-12">
                    <label htmlFor="content">
                        상세 내용 <span className="text-red-500">*</span>
                    </label>
                    <CustomEditor
                        value={todo.content}
                        delta={todo.delta}
                        style={{ height: '200px' }}
                        onChange={(data) => {
                            setTodo((prev) => ({
                                ...prev,
                                content: data.textValue,
                                delta: data.delta
                            }));
                        }}
                    />
                </div>
            </div>
        </Dialog>
    );
};

export default TodoModal;
