'use client';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { TreeSelect } from 'primereact/treeselect';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { useState, useEffect, useMemo } from 'react';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '@/hooks/useToast';
import { USER_AUTH_OPTIONS } from '@/constants/user';
import { AppMenuModel } from '@/constants/menu';
import { TreeNode } from 'primereact/treenode';
import dayjs from 'dayjs';

export interface User {
    userId: string;
    userName: string;
    email: string;
    auth: string | null;
    password?: string;
    menuPermissions?: string[];
    expiryDate?: Date | null;
    useYn?: boolean;
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

// 기본 권한
const defaultAuth = [
    '/attendanceList',
    '/studentAttendanceStatistics',
    '/praise',
    '/attendance',
    '/weekSchedule',
    '/assistantTodo',
    '/kakao-share',
    '/studentList',
    '/classList',
    '/manual'
];

const UserModal = ({ visible, pData, onClose }: UserModalProps) => {
    const mode = pData?.mode || 'new';
    const initialUser = pData?.user;
    const authOptions = pData?.authOptions || USER_AUTH_OPTIONS;

    const http = useHttp();
    const { showToast } = useToast();

    const treeNodes = useMemo(() => {
        return AppMenuModel.map((group, index) => ({
            key: `group-${index}`,
            label: group.label,
            icon: group.icon,
            children: group.items?.map((item) => ({
                key: item.to || `${group.label}-${item.label}`,
                label: item.label,
                icon: item.icon,
                data: item.to
            }))
        })) as TreeNode[];
    }, []);

    const [user, setUser] = useState<User>({
        userId: '',
        userName: '',
        email: '',
        password: '',
        auth: null,
        menuPermissions: [],
        expiryDate: null,
        useYn: true
    });
    const [submitted, setSubmitted] = useState(false);

    const selectionKeys = useMemo(() => {
        const keys: any = {};
        if (!user.menuPermissions) return keys;

        user.menuPermissions.forEach((path) => {
            keys[path] = { checked: true, partialChecked: false };
        });

        // 부모 노드(그룹)의 체크 상태 계산
        AppMenuModel.forEach((group, index) => {
            const groupKey = `group-${index}`;
            const children = group.items || [];
            const childPaths = children.map((c) => c.to).filter(Boolean) as string[];

            if (childPaths.length === 0) return;

            const selectedChildPaths = childPaths.filter((p) => user.menuPermissions?.includes(p));

            if (selectedChildPaths.length === childPaths.length) {
                keys[groupKey] = { checked: true, partialChecked: false };
            } else if (selectedChildPaths.length > 0) {
                keys[groupKey] = { checked: false, partialChecked: true };
            }
        });

        return keys;
    }, [user.menuPermissions]);

    const onTreeChange = (e: any) => {
        const keys = e.value;
        const selectedPaths: string[] = [];

        // AppMenuModel을 순회하며 체크된 리프 노드(to 경로)만 추출
        AppMenuModel.forEach((group) => {
            group.items?.forEach((item) => {
                if (item.to && keys[item.to]?.checked) {
                    selectedPaths.push(item.to);
                }
            });
        });

        setUser({ ...user, menuPermissions: selectedPaths });
    };

    useEffect(() => {
        if (visible) {
            if (mode === 'edit' && initialUser) {
                setUser({
                    ...initialUser,
                    menuPermissions: initialUser.menuPermissions || [],
                    expiryDate: initialUser.expiryDate ? new Date(initialUser.expiryDate) : null,
                    useYn: initialUser.useYn !== undefined ? initialUser.useYn : true
                });
            } else {
                setUser({
                    userId: '',
                    userName: '',
                    email: '',
                    password: '',
                    auth: null,
                    menuPermissions: [],
                    expiryDate: dayjs().add(1, 'year').toDate(),
                    useYn: true
                });
            }
            setSubmitted(false);
        }
    }, [visible, mode, initialUser]);

    useEffect(() => {
        if (user.auth && user.auth !== 'admin' && mode === 'new') {
            setUser((prev) => ({ ...prev, menuPermissions: defaultAuth }));
        }
    }, [user.auth, mode]);

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
                    ...user,
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
            blockScroll
        >
            <div className="field">
                <label htmlFor="userId">
                    사용자 ID <span className="text-red-500">{!isEditMode && '*'}</span>
                </label>
                <InputText
                    id="userId"
                    value={user.userId}
                    onChange={(e) => {
                        const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '');
                        setUser({ ...user, userId: sanitizedValue });
                    }}
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
                    <TreeSelect
                        id="menuPermissions"
                        value={selectionKeys}
                        options={treeNodes}
                        onChange={onTreeChange}
                        display="chip"
                        selectionMode="checkbox"
                        placeholder="접근 가능한 메뉴를 선택하세요"
                        className="w-full"
                        metaKeySelection={false}
                    />
                </div>
            )}
            {user.auth !== 'admin' && (
                <div className="field">
                    <label htmlFor="expiryDate">만료일</label>
                    <Calendar
                        id="expiryDate"
                        value={user.expiryDate}
                        onChange={(e) => setUser({ ...user, expiryDate: e.value as Date })}
                        showIcon
                        placeholder="만료일을 선택하세요"
                        dateFormat="yy-mm-dd"
                        locale="ko"
                    />
                </div>
            )}
            {user.auth !== 'admin' && (
                <div className="field">
                    <Checkbox
                        id="useYn"
                        onChange={(e) => setUser({ ...user, useYn: e.checked ?? false })}
                        checked={user.useYn || false}
                    />
                    <label htmlFor="useYn" className="ml-2">
                        사용 여부
                    </label>
                </div>
            )}
        </Dialog>
    );
};

export default UserModal;
