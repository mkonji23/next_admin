'use client';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { useState, useEffect, useMemo } from 'react';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { USER_AUTH_OPTIONS } from '@/constants/user';
import { AppMenuModel } from '@/constants/menu';

export interface User {
    userId: string;
    userName: string;
    email: string;
    auth: string | null;
    password?: string;
    menuPermissions?: string[];
}

interface UserModalProps {
    visible: boolean;
    pData?: {
        mode?: 'edit' | 'new';
        user?: User;
        authOptions?: { label: string; value: string }[];
    };
    onClose: (result?: User | null) => void;
}

const UserModal = ({ visible, pData, onClose }: UserModalProps) => {
    const mode = pData?.mode || 'new';
    const initialUser = pData?.user;
    const authOptions = pData?.authOptions || USER_AUTH_OPTIONS;

    const http = useHttp();
    const { showToast } = useToast();

    const menuOptions = useMemo(() => {
        const options: { label: string; value: string }[] = [];
        AppMenuModel.forEach((group) => {
            if (group.items) {
                group.items.forEach((item) => {
                    if (item.to) {
                        options.push({
                            label: `${group.label} > ${item.label}`,
                            value: item.to
                        });
                    }
                });
            }
        });
        return options;
    }, []);

    const [user, setUser] = useState<User>({
        userId: '',
        userName: '',
        email: '',
        password: '',
        auth: null,
        menuPermissions: []
    });
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (visible) {
            if (mode === 'edit' && initialUser) {
                setUser({ ...initialUser, menuPermissions: initialUser.menuPermissions || [] });
            } else {
                setUser({
                    userId: '',
                    userName: '',
                    email: '',
                    password: '',
                    auth: null,
                    menuPermissions: []
                });
            }
            setSubmitted(false);
        }
    }, [visible, mode, initialUser]);

    const isEditMode = mode === 'edit';
    const header = isEditMode ? '사용자 수정' : '사용자 등록';
    const saveButtonLabel = isEditMode ? '저장' : '등록';

    const handleSave = async () => {
        setSubmitted(true);

        // Validation
        if (mode === 'new') {
            if (!user.userId || !user.userName || !user.email || !user.password || !user.auth) {
                showToast({ severity: 'error', summary: '입력 오류', detail: '모든 필드를 입력해주세요.' });
                return;
            }
        } else {
            if (!user.userName || !user.email || !user.auth) {
                showToast({ severity: 'error', summary: '입력 오류', detail: '모든 필드를 입력해주세요.' });
                return;
            }
        }

        try {
            if (mode === 'new') {
                const payload = {
                    userId: user.userId,
                    userName: user.userName,
                    email: user.email,
                    auth: user.auth,
                    password: user.password,
                    menuPermissions: user.menuPermissions || [],
                    createdDate: new Date()
                };

                await http.post('/choiMath/user/signup', payload);
                showToast({ severity: 'success', summary: '등록 성공', detail: '사용자 등록에 성공했습니다.' });
            } else {
                await http.post(`/choiMath/user/updateUser`, user);
                showToast({ severity: 'success', summary: '수정 성공', detail: '사용자 정보가 수정되었습니다.' });
            }
            onClose(user);
        } catch (error: any) {
            console.error('Error saving user:', error);
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
            style={{ width: '450px' }}
            header={header}
            modal
            className="p-fluid"
            footer={dialogFooter}
            onHide={handleCancel}
        >
            <div className="field">
                <label htmlFor="userId">
                    사용자 ID <span className="text-red-500">{!isEditMode && '*'}</span>
                </label>
                <InputText
                    id="userId"
                    value={user.userId}
                    onChange={(e) => setUser({ ...user, userId: e.target.value })}
                    disabled={isEditMode}
                    required={!isEditMode}
                    className={submitted && !isEditMode && !user.userId ? 'p-invalid' : ''}
                />
                {submitted && !isEditMode && !user.userId && (
                    <small className="p-invalid">사용자 ID를 입력해주세요.</small>
                )}
            </div>
            <div className="field">
                <label htmlFor="userName">
                    이름 <span className="text-red-500">*</span>
                </label>
                <InputText
                    id="userName"
                    value={user.userName}
                    onChange={(e) => setUser({ ...user, userName: e.target.value })}
                    required
                    className={submitted && !user.userName ? 'p-invalid' : ''}
                />
                {submitted && !user.userName && <small className="p-invalid">이름을 입력해주세요.</small>}
            </div>
            <div className="field">
                <label htmlFor="email">
                    이메일 <span className="text-red-500">*</span>
                </label>
                <InputText
                    id="email"
                    type="email"
                    value={user.email}
                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                    required
                    className={submitted && !user.email ? 'p-invalid' : ''}
                />
                {submitted && !user.email && <small className="p-invalid">이메일을 입력해주세요.</small>}
            </div>
            {!isEditMode && (
                <div className="field">
                    <label htmlFor="password">
                        비밀번호 <span className="text-red-500">*</span>
                    </label>
                    <Password
                        id="password"
                        value={user.password || ''}
                        onChange={(e) => setUser({ ...user, password: e.target.value })}
                        feedback={false}
                        toggleMask
                        required
                        className={submitted && !user.password ? 'p-invalid' : ''}
                    />
                    {submitted && !user.password && <small className="p-invalid">비밀번호를 입력해주세요.</small>}
                </div>
            )}
            <div className="field">
                <label htmlFor="auth">
                    권한 <span className="text-red-500">*</span>
                </label>
                <Dropdown
                    id="auth"
                    value={user.auth}
                    options={authOptions}
                    onChange={(e) => setUser({ ...user, auth: e.value })}
                    placeholder="권한을 선택하세요"
                    className={submitted && !user.auth ? 'p-invalid' : ''}
                />
                {submitted && !user.auth && <small className="p-invalid">권한을 선택해주세요.</small>}
            </div>
            {user.auth !== 'admin' && (
                <div className="field">
                    <label htmlFor="menuPermissions">메뉴 접근 권한</label>
                    <MultiSelect
                        id="menuPermissions"
                        value={user.menuPermissions}
                        options={menuOptions}
                        onChange={(e) => setUser({ ...user, menuPermissions: e.value })}
                        placeholder="접근 가능한 메뉴를 선택하세요"
                        display="chip"
                    />
                </div>
            )}
        </Dialog>
    );
};

export default UserModal;
