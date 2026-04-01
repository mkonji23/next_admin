'use client';

import React, { useState, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { useHttp } from '@/util/axiosInstance';
import { Student } from '../modals/StudentModal';
import { useToast } from '@/hooks/useToast';
import { Password } from 'primereact/password';

export interface StudentAuthData {
    studentId?: string;
    name?: string;
    school?: string;
    grade?: string;
    phoneNumber?: string;
}

const withStudentAuth = <P extends object>(
    WrappedComponent: React.ComponentType<P & { studentAuthData: StudentAuthData }>
) => {
    const StudentAuthProtectedComponent = (props: P) => {
        const http = useHttp();
        const { showToast } = useToast();

        const [isAuthorized, setIsAuthorized] = useState(false);
        const [studentAuthData, setStudentAuthData] = useState<StudentAuthData | null>(null);

        // New state management
        const [authState, setAuthState] = useState<'INITIAL' | 'PASSWORD_VERIFY' | 'PASSWORD_CREATE'>('INITIAL');
        const [foundStudent, setFoundStudent] = useState<Student | null>(null);
        const [password, setPassword] = useState('');

        const [name, setName] = useState('');
        const [phone, setPhone] = useState('');
        const [error, setError] = useState('');
        const [loading, setLoading] = useState(false);

        useEffect(() => {
            const authId = sessionStorage.getItem('student_auth_id');
            const authName = sessionStorage.getItem('student_auth_name');
            const authSchool = sessionStorage.getItem('student_auth_school') || undefined;
            const authGrade = sessionStorage.getItem('student_auth_grade') || undefined;
            const authPhone = sessionStorage.getItem('student_auth_phone') || undefined;

            if (authId && authName) {
                setStudentAuthData({
                    studentId: authId,
                    name: authName,
                    school: authSchool,
                    grade: authGrade,
                    phoneNumber: authPhone
                });
                setIsAuthorized(true);
            }
        }, []);

        const handleVerify = async () => {
            if (!name.trim()) {
                setError('이름을 입력해주세요.');
                return;
            }
            if (!phone.trim()) {
                setError('전화번호를 입력해주세요.');
                return;
            }

            setLoading(true);
            setError('');

            try {
                const cleanPhone = phone.trim().replace(/[^\d]/g, '');

                const res = await http.get('/choiMath/student/getStudentList', {
                    params: {
                        name: name.trim(),
                        phoneNumber: cleanPhone
                    }
                });
                const students = res.data || [];
                if (students && students.length > 0 && students[0]?.studentId) {
                    setFoundStudent(students[0]);
                    setPassword('');
                    if (students[0]?.hasSimplePassword) {
                        // 비밀번호 존재여부체크
                        setAuthState('PASSWORD_VERIFY'); // Transition to password verification
                    } else {
                        showToast({
                            severity: 'info',
                            summary: '비밀번호 생성 필요',
                            detail: '간편 비밀번호를 먼저 생성해주세요.'
                        });
                        setAuthState('PASSWORD_CREATE');
                    }
                } else {
                    setError('일치하는 학생 정보가 없습니다. 이름과 전화번호를 다시 확인해주세요.');
                }
            } catch (err: any) {
                console.error('Auth error:', err);
                setError('인증 처리 중 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        };

        const handlePasswordSubmit = async () => {
            if (!password) {
                setError('비밀번호를 입력해주세요.');
                return;
            }
            if (!foundStudent) {
                setError('학생 정보가 없습니다. 다시 시도해주세요.');
                setAuthState('INITIAL');
                return;
            }

            setLoading(true);
            setError('');

            try {
                const res = await http.post('/choiMath/student/verifyPassword', {
                    studentId: foundStudent.studentId,
                    password: password
                });

                if (res.data.isValid) {
                    const studentData = res.data.student;
                    setStudentAuthData(studentData);
                    setIsAuthorized(true);

                    sessionStorage.setItem('student_auth_id', studentData.studentId);
                    sessionStorage.setItem('student_auth_name', studentData.name);
                    sessionStorage.setItem('student_auth_phone', studentData.phoneNumber);
                    if (studentData.school) sessionStorage.setItem('student_auth_school', studentData.school);
                    if (studentData.grade) sessionStorage.setItem('student_auth_grade', studentData.grade);
                }
            } catch (err: any) {
                if (err === 'Invalid password') {
                    setError('비밀번호가 일치하지 않습니다.');
                } else {
                    setError('비밀번호 확인 중 오류가 발생했습니다.');
                }
            } finally {
                setLoading(false);
            }
        };

        const handlePasswordCreate = async () => {
            if (password.length !== 4 || !/^\d{4}$/.test(password)) {
                setError('비밀번호는 4자리 숫자로 입력해주세요.');
                return;
            }
            if (!foundStudent) {
                setError('학생 정보가 없습니다. 다시 시도해주세요.');
                setAuthState('INITIAL');
                return;
            }

            setLoading(true);
            setError('');

            try {
                await http.post('/choiMath/student/updateStudent', {
                    studentId: foundStudent.studentId,
                    simplePassword: password
                });

                showToast({
                    severity: 'success',
                    summary: '비밀번호 생성 완료',
                    detail: '생성한 비밀번호로 다시 로그인해주세요.'
                });
                setAuthState('PASSWORD_VERIFY');
                setPassword('');
            } catch (err: any) {
                console.error('Password create error:', err);
                setError('비밀번호 생성 중 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        };

        if (isAuthorized && studentAuthData) {
            return <WrappedComponent {...props} studentAuthData={studentAuthData} />;
        }

        const renderInitial = () => (
            <div className="flex flex-column gap-3 mt-2">
                <div className="flex flex-column gap-2">
                    <label className="text-sm font-semibold text-700" htmlFor="nameInput">
                        이름
                    </label>
                    <div className="p-inputgroup">
                        <span className="p-inputgroup-addon bg-blue-50 border-blue-100 text-blue-500">
                            <i className="pi pi-user"></i>
                        </span>
                        <InputText
                            id="nameInput"
                            placeholder="이름을 입력하세요"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                            className={`border-blue-100 focus:border-blue-400 ${error ? 'p-invalid' : ''}`}
                            disabled={loading}
                        />
                    </div>
                </div>
                <div className="flex flex-column gap-2 mt-2">
                    <label className="text-sm font-semibold text-700" htmlFor="phoneInput">
                        전화번호
                    </label>
                    <div className="p-inputgroup">
                        <span className="p-inputgroup-addon bg-blue-50 border-blue-100 text-blue-500">
                            <i className="pi pi-mobile"></i>
                        </span>
                        <InputText
                            id="phoneInput"
                            placeholder="ex) 01012345678"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                            keyfilter="num"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className={`border-blue-100 focus:border-blue-400 ${error ? 'p-invalid' : ''}`}
                            disabled={loading}
                        />
                    </div>
                </div>
                <Button
                    label={loading ? '확인 중...' : '조회하기'}
                    icon={loading ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
                    onClick={handleVerify}
                    disabled={loading || !name || !phone}
                    className="w-full mt-4 p-3 font-bold border-round-xl shadow-2"
                />
            </div>
        );

        const renderPasswordVerify = () => (
            <div className="flex flex-column gap-3 mt-2">
                <div className="text-center">
                    <p className="text-lg font-bold text-blue-600">{foundStudent?.name}님, 안녕하세요!</p>
                </div>
                <div className="flex flex-column gap-2">
                    <label className="text-sm font-semibold text-700" htmlFor="passwordInput">
                        간편 비밀번호
                    </label>
                    <div className="p-inputgroup">
                        <span className="p-inputgroup-addon bg-blue-50 border-blue-100 text-blue-500">
                            <i className="pi pi-lock"></i>
                        </span>
                        <InputText
                            id="passwordInput"
                            type="password"
                            placeholder="비밀번호를 입력하세요"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                            className={`border-blue-100 focus:border-blue-400 ${error ? 'p-invalid' : ''}`}
                            disabled={loading}
                        />
                    </div>
                </div>
                <Button
                    label={loading ? '확인 중...' : '로그인'}
                    icon={loading ? 'pi pi-spin pi-spinner' : 'pi pi-sign-in'}
                    onClick={handlePasswordSubmit}
                    disabled={loading || !password}
                    className="w-full mt-4 p-3 font-bold border-round-xl shadow-2"
                />
            </div>
        );

        const renderPasswordCreate = () => (
            <div className="flex flex-column gap-3 mt-2">
                <div className="text-center">
                    <p className="text-lg font-bold text-green-600">첫 로그인입니다!</p>
                    <p className="text-sm text-600 -mt-2">사용하실 4자리 비밀번호를 생성해주세요.</p>
                </div>
                <div className="flex flex-column gap-2">
                    <label className="text-sm font-semibold text-700" htmlFor="newPasswordInput">
                        새 간편 비밀번호 (4자리 숫자)
                    </label>
                    <div className="p-inputgroup">
                        <span className="p-inputgroup-addon bg-green-50 border-green-100 text-green-500">
                            <i className="pi pi-key"></i>
                        </span>
                        <Password
                            id="newPasswordInput"
                            type="password"
                            toggleMask
                            maxLength={4}
                            placeholder="숫자 4자리를 입력하세요"
                            value={password}
                            onChange={(e) => setPassword(e.target.value.replace(/[^0-9]/g, ''))}
                            onKeyDown={(e) => e.key === 'Enter' && handlePasswordCreate()}
                            keyfilter="num"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className={`border-green-100 focus:border-green-400 ${error ? 'p-invalid' : ''}`}
                            disabled={loading}
                            feedback={false}
                        />
                    </div>
                </div>
                <Button
                    label={loading ? '저장 중...' : '비밀번호 생성 및 저장'}
                    icon={loading ? 'pi pi-spin pi-spinner' : 'pi pi-save'}
                    onClick={handlePasswordCreate}
                    disabled={loading || password.length !== 4}
                    className="w-full mt-4 p-3 font-bold border-round-xl shadow-2 p-button-success"
                />
            </div>
        );

        const renderContent = () => {
            switch (authState) {
                case 'INITIAL':
                    return renderInitial();
                case 'PASSWORD_VERIFY':
                    return renderPasswordVerify();
                case 'PASSWORD_CREATE':
                    return renderPasswordCreate();
                default:
                    return renderInitial();
            }
        };

        return (
            <div
                className="flex align-items-center justify-content-center min-h-screen p-3"
                style={{ background: 'linear-gradient(135deg, #f6f8fd 0%, #f1f6f9 100%)' }}
            >
                <Card
                    style={{
                        width: '100%',
                        maxWidth: '400px',
                        borderRadius: '1.5rem',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
                    }}
                    className="border-none"
                >
                    <div className="text-center mb-5 mt-3">
                        {/* 자물쇠 */}
                        {authState !== 'INITIAL' && <i className={`pi pi-lock text-primary text-5xl mb-3`}></i>}
                        {/* 로고 */}
                        {authState === 'INITIAL' && (
                            <img
                                src={`/layout/images/logo-dark.svg`}
                                alt="chocho"
                                height="50"
                                className="mr-0 lg:mr-2"
                            />
                        )}
                        <h2 className="text-2xl font-bold mb-2 text-900">
                            {authState === 'INITIAL' && '본인 확인'}
                            {authState === 'PASSWORD_VERIFY' && '비밀번호 확인'}
                            {authState === 'PASSWORD_CREATE' && '비밀번호 생성'}
                        </h2>
                        <p className="text-600 m-0">
                            {authState === 'INITIAL' && '학생 본인 확인 후 조회가 가능합니다.'}
                            {authState === 'PASSWORD_VERIFY' && '안전한 접속을 위해 비밀번호를 입력해주세요.'}
                        </p>
                        <p className="text-red-600 font-bold m-0">
                            {authState === 'PASSWORD_VERIFY' && '비밀번호 분실시에는 관리자에게 문의하세요.'}
                        </p>
                    </div>
                    {renderContent()}
                    {error && (
                        <div className="p-message p-message-error p-message-sm p-2 mt-3 border-round-xl">
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}
                </Card>
            </div>
        );
    };

    StudentAuthProtectedComponent.displayName = `WithStudentAuth(${
        WrappedComponent.displayName || WrappedComponent.name || 'Component'
    })`;

    return StudentAuthProtectedComponent;
};

export default withStudentAuth;
