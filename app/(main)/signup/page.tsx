'use client';

import React, { useEffect, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Password } from 'primereact/password';
import { Card } from 'primereact/card';
import { useHttp } from '@/util/axiosInstance';
import { useToast } from '../../../hooks/useToast';

const SignupPage = () => {
    const { post } = useHttp();
    const { showToast } = useToast();
    const [userId, setUserId] = useState('');
    const [userName, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [auth, setAuth] = useState<string | null>(null);

    const authOptions = [
        { label: '관리자', value: 'admin' },
        { label: '학생', value: 'student' },
        { label: '선생님', value: 'teacher' },
        { label: '학부모님', value: 'parent' }
    ];

    const handleSignup = async () => {
        if (!userId || !userName || !email || !password || !auth) {
            showToast({ severity: 'error', summary: '입력 오류', detail: '모든 필드를 입력해주세요.' });
            return;
        }

        const payload = {
            userId,
            userName,
            email,
            auth,
            password, // 비밀번호는 서버에서 해싱해야 합니다.
            createdDate: new Date()
        };

        try {
            await post('/choiMath/user/signup', payload);
            showToast({ severity: 'success', summary: '등록 성공', detail: '사용자 등록에 성공했습니다.' });
            // 폼 초기화
            setUserId('');
            setUserName('');
            setEmail('');
            setPassword('');
            setAuth(null);
        } catch (error: any) {
            console.error('Signup failed:', error);
            const errorMessage = error.response?.data?.message || error.message || '알 수 없는 오류가 발생했습니다.';
            showToast({ severity: 'error', summary: '등록 실패', detail: errorMessage });
        }
    };

    useEffect(() => {
        // 폼 초기화
        setUserId('');
        setUserName('');
        setEmail('');
        setPassword('');
        setAuth(null);
    }, []);

    return (
        <div className="grid">
            <div className="col-12 md:col-8 lg:col-6">
                <Card title="사용자 등록">
                    <div className="p-fluid formgrid grid">
                        <div className="field col-12">
                            <label htmlFor="userId">사용자 ID</label>
                            <InputText id="userId" value={userId} onChange={(e) => setUserId(e.target.value)} />
                        </div>
                        <div className="field col-12">
                            <label htmlFor="userName">이름</label>
                            <InputText id="userName" value={userName} onChange={(e) => setUserName(e.target.value)} />
                        </div>
                        <div className="field col-12">
                            <label htmlFor="email">이메일</label>
                            <InputText
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="field col-12">
                            <label htmlFor="password">비밀번호</label>
                            <Password
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                feedback={false}
                                toggleMask
                            />
                        </div>
                        <div className="field col-12">
                            <label htmlFor="auth">권한</label>
                            <Dropdown
                                id="auth"
                                value={auth}
                                options={authOptions}
                                onChange={(e) => setAuth(e.value)}
                                placeholder="권한을 선택하세요"
                            />
                        </div>
                        <div className="field col-12 mt-4">
                            <Button label="등록하기" onClick={handleSignup} />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SignupPage;
