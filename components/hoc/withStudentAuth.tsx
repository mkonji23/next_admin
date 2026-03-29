'use client';

import React, { useState, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { useHttp } from '@/util/axiosInstance';

export interface StudentAuthData {
    studentId: string;
    name: string;
    school?: string;
    grade?: string;
    phone?: string;
}

const withStudentAuth = <P extends object>(WrappedComponent: React.ComponentType<P & { studentAuthData: StudentAuthData }>) => {
    const StudentAuthProtectedComponent = (props: P) => {
        const http = useHttp();

        const [isAuthorized, setIsAuthorized] = useState(false);
        const [studentAuthData, setStudentAuthData] = useState<StudentAuthData | null>(null);
        
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
                setStudentAuthData({ studentId: authId, name: authName, school: authSchool, grade: authGrade, phone: authPhone });
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
                
                // Fetch student list
                const res = await http.get('/choiMath/student/getStudentList', {
                    params: {
                        name: name.trim(),
                        phoneNumber: cleanPhone
                    }
                });
                const students = res.data || [];
                // Find matching student
                if (students && students.length > 0 && students[0]?.studentId) {
                    setIsAuthorized(true);
                    setStudentAuthData({ 
                        studentId: students[0].studentId, 
                        name: students[0].name,
                        school: students[0].school,
                        grade: students[0].grade,
                        phone: cleanPhone
                    });
                    
                    sessionStorage.setItem('student_auth_id', students[0].studentId);
                    sessionStorage.setItem('student_auth_name', students[0].name);
                    sessionStorage.setItem('student_auth_phone', cleanPhone);
                    if (students[0].school) sessionStorage.setItem('student_auth_school', students[0].school);
                    if (students[0].grade) sessionStorage.setItem('student_auth_grade', students[0].grade);
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

        if (isAuthorized && studentAuthData) {
            return <WrappedComponent {...props} studentAuthData={studentAuthData} />;
        }

        return (
            <div className="flex align-items-center justify-content-center min-h-screen p-3" style={{ background: 'linear-gradient(135deg, #f6f8fd 0%, #f1f6f9 100%)' }}>
                <Card
                    style={{ width: '100%', maxWidth: '400px', borderRadius: '1.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
                    className="border-none"
                >
                    <div className="text-center mb-5 mt-3">
                        <i className="pi pi-user text-primary text-5xl mb-3"></i>
                        <h2 className="text-2xl font-bold mb-2 text-900">본인 확인</h2>
                        <p className="text-600 m-0">학생 본인 확인 후 조회가 가능합니다.</p>
                    </div>

                    <div className="flex flex-column gap-3 mt-2">
                        <div className="flex flex-column gap-2">
                            <label className="text-sm font-semibold text-700" htmlFor="nameInput">이름</label>
                            <div className="p-inputgroup">
                                <span className="p-inputgroup-addon bg-blue-50 border-blue-100 text-blue-500">
                                    <i className="pi pi-user"></i>
                                </span>
                                <InputText
                                    id="nameInput"
                                    placeholder="ex) 홍길동"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                                    className={`border-blue-100 focus:border-blue-400 ${error ? 'p-invalid' : ''}`}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="flex flex-column gap-2 mt-2">
                            <label className="text-sm font-semibold text-700" htmlFor="phoneInput">전화번호</label>
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

                        {error && (
                            <div className="p-message p-message-error p-message-sm p-2 mt-2 border-round-xl">
                                <span className="text-sm font-medium">{error}</span>
                            </div>
                        )}
                        
                        <Button
                            label={loading ? '확인 중...' : '조회하기'}
                            icon={loading ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
                            onClick={handleVerify}
                            disabled={loading || !name || !phone}
                            className="w-full mt-4 p-3 font-bold border-round-xl shadow-2"
                        />
                    </div>
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
