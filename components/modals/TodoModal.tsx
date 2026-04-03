'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { MultiSelect } from 'primereact/multiselect';
import { InputSwitch } from 'primereact/inputswitch';
import { InputText } from 'primereact/inputtext';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { Todo, TodoUser } from '@/types/todo';
import dayjs from 'dayjs';
import { Editor } from 'primereact/editor';
import Quill from 'quill';
import { CustomEditor } from '../editor/CustomEditor';

interface TodoModalProps {
    visible: boolean;
    pData?: {
        mode?: 'edit' | 'new';
        todo?: Todo;
        initialDate?: Date;
    };
    onClose: (result?: Todo | null) => void;
}

const TodoModal = ({ visible, pData, onClose }: TodoModalProps) => {
    const contentRef = useRef<Editor>(null);
    const editorLoad = useRef(false);
    const mode = pData?.mode || 'new';
    const initialTodo = pData?.todo;
    const initialDate = pData?.initialDate || new Date();

    const http = useHttp();
    const { showToast } = useToast();

    const [todo, setTodo] = useState<Partial<Todo>>({
        date: initialDate,
        assignees: [],
        content: '',
        workingHours: '',
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
                    date: dayjs(initialTodo.date).toDate()
                });
            } else {
                setTodo({
                    date: initialDate,
                    assignees: [],
                    content: '',
                    workingHours: '',
                    isCompleted: false
                });
            }
            setSubmitted(false);
        }
    }, [visible]);

    const handleSave = async (action: 'save' | 'complete' = 'save') => {
        setSubmitted(true);

        if (!todo.date || !todo.content || !todo.assignees || todo.assignees.length === 0) {
            showToast({ severity: 'error', summary: '입력 오류', detail: '모든 필드를 입력해주세요.' });
            return;
        }

        try {
            const isCompletedValue = action === 'complete' ? true : todo.isCompleted ?? false;

            const payload: Todo = {
                id: todo.id || '',
                date: dayjs(todo.date).format('YYYYMMDD'),
                assignees: todo.assignees || [],
                content: todo.content || '',
                delta: todo.delta || [],
                workingHours: todo.workingHours || '',
                isCompleted: isCompletedValue,
                createdAt: todo.createdAt
            };

            if (mode === 'new') {
                const response = await http.post('/choiMath/todo/createTodo', payload);
                showToast({ severity: 'success', summary: '등록 성공', detail: '할 일이 등록되었습니다.' });
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
                    {!todo.isCompleted && (
                        <Button
                            label="완료"
                            icon="pi pi-check-circle"
                            onClick={() => handleSave('complete')}
                            className="p-button-success"
                        />
                    )}
                    <Button label="취소" icon="pi pi-times" onClick={() => onClose()} className="p-button-text" />
                    <Button
                        label="수정"
                        icon="pi pi-check"
                        onClick={() => handleSave('save')}
                        className="p-button-warning"
                    />
                </>
            ) : (
                <>
                    <Button label="취소" icon="pi pi-times" onClick={() => onClose(null)} className="p-button-text" />
                    <Button label="저장" icon="pi pi-save" onClick={() => handleSave('save')} />
                </>
            )}
        </div>
    );
    return (
        <Dialog
            visible={visible}
            style={{ width: '750px' }}
            header={mode === 'edit' ? '할 일 수정' : '신규 할 일'}
            modal
            className="p-fluid"
            footer={dialogFooter}
            onHide={() => onClose(null)}
        >
            <div className="field">
                <label htmlFor="date">
                    날짜 <span className="text-red-500">*</span>
                </label>
                <Calendar
                    id="date"
                    value={todo.date as Date}
                    onChange={(e) => setTodo({ ...todo, date: e.value as Date })}
                    showIcon
                    dateFormat="yy-mm-dd"
                    className={submitted && !todo.date ? 'p-invalid' : ''}
                    locale="ko"
                />
            </div>
            <div className="field">
                <label htmlFor="assignees">
                    담당자 (중복 선택 가능) <span className="text-red-500">*</span>
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
            <div className="field">
                <label htmlFor="workingHours">근무시간(시간)</label>
                <InputText
                    id="workingHours"
                    value={todo.workingHours || ''}
                    onChange={(e) => setTodo({ ...todo, workingHours: e.target.value })}
                    placeholder="1, 1.5 ,7 ...."
                />
            </div>
            <div className="field">
                <label htmlFor="content">
                    업무 내용 <span className="text-red-500">*</span>
                </label>
                <CustomEditor
                    value={todo.content}
                    delta={todo.delta}
                    style={{ height: '320px' }}
                    onChange={(data) => {
                        setTodo((prev) => ({
                            ...prev,
                            content: data.textValue,
                            delta: data.delta
                        }));
                    }}
                />
            </div>
            <div className="field flex align-items-center gap-2">
                <label htmlFor="isCompleted" className="mb-0">
                    완료 여부
                </label>
                <InputSwitch
                    id="isCompleted"
                    checked={todo.isCompleted || false}
                    onChange={(e) => setTodo({ ...todo, isCompleted: e.value })}
                />
            </div>
        </Dialog>
    );
};

export default TodoModal;
