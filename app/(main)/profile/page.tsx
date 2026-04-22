'use client';

import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { ColorPicker } from 'primereact/colorpicker';
import useAuthStore from '@/store/useAuthStore';
import { getCommonLabel } from '@/util/common';
import { USER_AUTH_OPTIONS } from '@/constants/user';
import { useToast } from '@/hooks/useToast';
import { useHttp } from '@/util/axiosInstance';
import { requestFcmToken } from '@/lib/firebase';
import { InputSwitch } from 'primereact/inputswitch';

const ProfilePage = () => {
    const { userInfo, initializeFromStorage, setInfo } = useAuthStore();
    const { showToast } = useToast();
    const http = useHttp();
    const [mounted, setMounted] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [passwordDialogVisible, setPasswordDialogVisible] = useState(false);
    const [formData, setFormData] = useState({
        userName: '',
        userId: '',
        email: '',
        auth: ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordSubmitted, setPasswordSubmitted] = useState(false);
    const [selectedTagColor, setSelectedTagColor] = useState<string | undefined>(undefined);
    const [notificationEnabled, setNotificationEnabled] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

    useEffect(() => {
        initializeFromStorage();
        setMounted(true);

        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermissionStatus(Notification.permission);
            setNotificationEnabled(Notification.permission === 'granted');
        }
    }, [initializeFromStorage]);

    useEffect(() => {
        if (mounted && userInfo) {
            setFormData({
                userName: userInfo.userName || '',
                userId: userInfo.userId || '',
                email: userInfo.email || '',
                auth: userInfo.auth || ''
            });
            // Initialize selectedTagColor from userInfo
            setSelectedTagColor(userInfo.tagColor || undefined);
        }
    }, [mounted, userInfo]);

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (userInfo) {
            setFormData({
                userName: userInfo.userName || '',
                userId: userInfo.userId || '',
                email: userInfo.email || '',
                auth: userInfo.auth || ''
            });
            setSelectedTagColor(userInfo.tagColor || undefined); // Reset tag color on cancel
        }
    };

    const handleSave = async () => {
        if (!userInfo?.userId) {
            showToast({
                severity: 'error',
                summary: '오류',
                detail: '사용자 정보를 불러올 수 없습니다.'
            });
            return;
        }

        try {
            const updateData: any = {};
            if (formData.userName !== userInfo.userName) {
                updateData.userName = formData.userName;
            }
            if (formData.email !== userInfo.email) {
                updateData.email = formData.email;
            }
            // Check for tag color change
            if (selectedTagColor !== userInfo.tagColor) {
                updateData.tagColor = selectedTagColor;
            }

            if (Object.keys(updateData).length === 0) {
                showToast({
                    severity: 'warn',
                    summary: '변경 없음',
                    detail: '변경된 정보가 없습니다.'
                });
                setIsEditing(false);
                return;
            }

            const response = await http.post('/choiMath/user/updateUser', {
                userId: userInfo.userId,
                ...updateData
            });

            if (response.data.error) {
                throw new Error(response.data.message || '프로필 수정에 실패했습니다.');
            }

            // 업데이트된 정보로 userInfo 갱신
            const updatedUserInfo = {
                ...userInfo,
                ...updateData
            };
            setInfo(updatedUserInfo);

            showToast({
                severity: 'success',
                summary: '저장 완료',
                detail: '프로필 정보가 저장되었습니다.'
            });
            setIsEditing(false);
        } catch (error: any) {
            console.error('Error updating profile:', error);
            const errorMessage = error.response?.data?.message || error.message || '프로필 수정에 실패했습니다.';
            showToast({
                severity: 'error',
                summary: '저장 실패',
                detail: errorMessage
            });
        }
    };

    const handlePasswordChange = async () => {
        setPasswordSubmitted(true);

        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            showToast({
                severity: 'warn',
                summary: '입력 오류',
                detail: '모든 필드를 입력해주세요.'
            });
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showToast({
                severity: 'warn',
                summary: '비밀번호 불일치',
                detail: '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.'
            });
            return;
        }

        if (!userInfo?.userId) {
            showToast({
                severity: 'error',
                summary: '오류',
                detail: '사용자 정보를 불러올 수 없습니다.'
            });
            return;
        }

        try {
            const response = await http.post('/choiMath/user/changePassword', {
                userId: userInfo.userId,
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            if (response.data.error) {
                throw new Error(response.data.message || '비밀번호 변경에 실패했습니다.');
            }

            showToast({
                severity: 'success',
                summary: '변경 완료',
                detail: '비밀번호가 변경되었습니다.'
            });

            setPasswordDialogVisible(false);
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setPasswordSubmitted(false);
        } catch (error: any) {
            console.error('Error changing password:', error);
            const errorMessage = error.response?.data?.message || error.message || '비밀번호 변경에 실패했습니다.';
            showToast({
                severity: 'error',
                summary: '변경 실패',
                detail: errorMessage
            });
        }
    };

    const handleNotificationToggle = async (enabled: boolean) => {
        if (enabled) {
            // 알림 활성화 시도
            const token = await requestFcmToken();
            if (token) {
                try {
                    await http.post('/db/saveToken', {
                        token,
                        type: process.env.NODE_ENV === 'development' ? 'debug' : 'release'
                    });
                    setNotificationEnabled(true);
                    setPermissionStatus('granted');
                    showToast({
                        severity: 'success',
                        summary: '알림 활성화',
                        detail: '푸시 알림이 성공적으로 활성화되었습니다.'
                    });
                } catch (error) {
                    console.error('Failed to save token:', error);
                    showToast({
                        severity: 'error',
                        summary: '오류',
                        detail: '알림 토큰 저장에 실패했습니다.'
                    });
                    setNotificationEnabled(false);
                }
            } else {
                setNotificationEnabled(false);
                if (Notification.permission === 'denied') {
                    showToast({
                        severity: 'error',
                        summary: '권한 거부됨',
                        detail: '브라우저 설정에서 알림 권한을 허용해주세요.'
                    });
                }
            }
        } else {
            // 알림 비활성화는 브라우저 수준에서 막을 수 없으므로,
            // 서버에서 토큰을 삭제하거나 상태만 변경하는 식으로 구현 가능합니다.
            // 여기서는 UI 상태만 변경합니다.
            setNotificationEnabled(false);
            showToast({
                severity: 'info',
                summary: '알림 비활성화',
                detail: '이 기기에서 알림 수신을 중단합니다. (브라우저 권한은 유지됩니다)'
            });
        }
    };

    const handlePasswordDialogClose = () => {
        setPasswordDialogVisible(false);
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setPasswordSubmitted(false);
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value
        }));
    };

    if (!mounted) {
        return <div>Loading...</div>;
    }

    return (
        <div className="card">
            <Card
                title="프로필"
                style={{
                    border: '1px solid #dee2e6',
                    borderRadius: '12px'
                }}
            >
                <div className="grid formgrid p-fluid">
                    <div className="col-12">
                        <div className="grid">
                            <div className="field col-12 md:col-6">
                                <label htmlFor="userName">이름</label>
                                {isEditing ? (
                                    <InputText
                                        id="userName"
                                        value={formData.userName}
                                        onChange={(e) => handleInputChange('userName', e.target.value)}
                                        className="w-full"
                                    />
                                ) : (
                                    <div className="text-900 font-medium text-lg p-2">{userInfo?.userName || '-'}</div>
                                )}
                            </div>
                            <div className="field col-12 md:col-6">
                                <label htmlFor="userId">사용자 ID</label>
                                {isEditing ? (
                                    <InputText
                                        id="userId"
                                        value={formData.userId}
                                        onChange={(e) => handleInputChange('userId', e.target.value)}
                                        className="w-full"
                                        disabled
                                    />
                                ) : (
                                    <div className="text-900 font-medium text-lg p-2">{userInfo?.userId || '-'}</div>
                                )}
                            </div>
                            <div className="field col-12 md:col-6">
                                <label htmlFor="password">비밀번호</label>
                                <div className="text-900 font-medium text-lg p-2">
                                    <Button
                                        className="w-auto"
                                        label="비밀번호 변경"
                                        icon="pi pi-key"
                                        onClick={() => setPasswordDialogVisible(true)}
                                        severity="warning"
                                        outlined
                                    />
                                </div>
                            </div>
                            <div className="field col-12 md:col-6">
                                <label htmlFor="email">이메일</label>
                                {isEditing ? (
                                    <InputText
                                        id="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className="w-full"
                                    />
                                ) : (
                                    <div className="text-900 font-medium text-lg p-2">{userInfo?.email || '-'}</div>
                                )}
                            </div>
                            <div className="field col-12 md:col-6">
                                <label htmlFor="auth">권한</label>
                                {isEditing ? (
                                    <div className="text-900 font-medium text-lg p-2">
                                        {getCommonLabel(USER_AUTH_OPTIONS, userInfo?.auth || '') || '-'}
                                    </div>
                                ) : (
                                    <div className="p-2">
                                        {userInfo?.auth ? (
                                            <Tag
                                                value={getCommonLabel(USER_AUTH_OPTIONS, userInfo.auth)}
                                                severity="info"
                                            />
                                        ) : (
                                            <span className="text-500">-</span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="field col-12 md:col-6">
                                <label htmlFor="tagColor">태그 색상</label>
                                {isEditing ? (
                                    <div className="p-inputgroup">
                                        <InputText
                                           id="tagColor"
                                           value={selectedTagColor || ''}
                                           onChange={(e) => setSelectedTagColor(e.target.value)}
                                           className="w-auto"
                                           placeholder="#RRGGBB 또는 색상 이름"
                                        />
                                        <ColorPicker
                                           value={selectedTagColor ? selectedTagColor.replace('#', '') : null}
                                           onChange={(e) => setSelectedTagColor(e.value ? `#${e.value}` : undefined)}
                                           format="hex"
                                           appendTo="self"
                                           style={{ width: '50px' }}
                                        />                                    </div>
                                ) : (
                                    <div className="p-2">
                                        {userInfo?.tagColor ? (
                                            <Tag
                                                value={userInfo.tagColor}
                                                style={{ backgroundColor: userInfo.tagColor }}
                                            />
                                        ) : (
                                            <span className="text-500">-</span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="field col-12 md:col-6">
                                <label>생성일자</label>
                                <div className="text-900 font-medium text-lg p-2">
                                    {userInfo?.createdDate
                                        ? new Date(userInfo.createdDate).toLocaleDateString('ko-KR')
                                        : '-'}
                                </div>
                            </div>
                            <div className="field col-12 md:col-6">
                                <label>상태</label>
                                <div className="p-2">
                                    <Tag value="활성" severity="success" />
                                </div>
                            </div>
                            <div className="field col-12 md:col-6">
                                <label htmlFor="notification">푸시 알림 설정</label>
                                <div className="flex align-items-center gap-3 p-2">
                                    <InputSwitch
                                        checked={notificationEnabled}
                                        onChange={(e) => handleNotificationToggle(e.value || false)}
                                        disabled={permissionStatus === 'denied'}
                                    />
                                    <span className="text-900 font-medium">
                                        {notificationEnabled ? '활성화됨' : '비활성화됨'}
                                    </span>
                                    {permissionStatus === 'denied' && (
                                        <small className="text-red-500">
                                            (브라우저에서 알림이 차단되어 있습니다)
                                        </small>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-12">
                        <div className="flex gap-4 justify-content-end align-items-end" style={{ width: '100%' }}>
                            {!isEditing ? (
                                <Button
                                    label="수정"
                                    icon="pi pi-pencil"
                                    onClick={handleEdit}
                                    className="p-button-primary"
                                />
                            ) : (
                                <>
                                    <Button
                                        label="취소"
                                        icon="pi pi-times"
                                        onClick={handleCancel}
                                        className="p-button-secondary"
                                    />
                                    <Button
                                        label="저장"
                                        icon="pi pi-check"
                                        onClick={handleSave}
                                        className="p-button-success"
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
            <Dialog
                header="비밀번호 변경"
                visible={passwordDialogVisible}
                style={{ width: '500px' }}
                onHide={handlePasswordDialogClose}
                footer={
                    <div>
                        <Button
                            label="취소"
                            icon="pi pi-times"
                            onClick={handlePasswordDialogClose}
                            className="p-button-text"
                        />
                        <Button
                            label="변경"
                            icon="pi pi-check"
                            onClick={handlePasswordChange}
                            className="p-button-primary"
                        />
                    </div>
                }
            >
                <div className="grid formgrid p-fluid">
                    <div className="field col-12">
                        <label htmlFor="currentPassword">
                            현재 비밀번호 <span className="text-red-500">*</span>
                        </label>
                        <Password
                            id="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                            feedback={false}
                            toggleMask
                            className={
                                passwordSubmitted && !passwordData.currentPassword ? 'w-full p-invalid' : 'w-full'
                            }
                            inputClassName="w-full"
                        />
                        {passwordSubmitted && !passwordData.currentPassword && (
                            <small className="p-invalid">현재 비밀번호를 입력해주세요.</small>
                        )}
                    </div>
                    <div className="field col-12">
                        <label htmlFor="newPassword">
                            새 비밀번호 <span className="text-red-500">*</span>
                        </label>
                        <Password
                            id="newPassword"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                            feedback={false}
                            toggleMask
                            className={passwordSubmitted && !passwordData.newPassword ? 'w-full p-invalid' : 'w-full'}
                            inputClassName="w-full"
                        />
                        {passwordSubmitted && !passwordData.newPassword && (
                            <small className="p-invalid">새 비밀번호를 입력해주세요.</small>
                        )}
                    </div>
                    <div className="field col-12">
                        <label htmlFor="confirmPassword">
                            새 비밀번호 확인 <span className="text-red-500">*</span>
                        </label>
                        <Password
                            id="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                            feedback={false}
                            toggleMask
                            className={
                                passwordSubmitted && !passwordData.confirmPassword ? 'w-full p-invalid' : 'w-full'
                            }
                            inputClassName="w-full"
                        />
                        {passwordSubmitted && !passwordData.confirmPassword && (
                            <small className="p-invalid">새 비밀번호 확인을 입력해주세요.</small>
                        )}
                        {passwordData.newPassword &&
                            passwordData.confirmPassword &&
                            passwordData.newPassword !== passwordData.confirmPassword && (
                                <small className="p-invalid">비밀번호가 일치하지 않습니다.</small>
                            )}
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default ProfilePage;
