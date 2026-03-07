'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { useHttp } from '@/util/axiosInstance';

const withPasswordProtection = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    const PasswordProtectedComponent = (props: P) => {
        const params = useParams();
        const id = params.id as string;
        const type = params.type as string;
        const http = useHttp();

        const [isAuthorized, setIsAuthorized] = useState(false);
        const [password, setPassword] = useState('');
        const [error, setError] = useState('');
        const [loading, setLoading] = useState(false);

        useEffect(() => {
            const authKey = `kakao_share_auth_${id}`;
            const auth = sessionStorage.getItem(authKey);
            if (auth === 'true') {
                setIsAuthorized(true);
            }
        }, [id]);

        const handleVerify = async () => {
            if (!password) {
                setError('비밀번호를 입력해주세요.');
                return;
            }

            setLoading(true);
            setError('');

            try {
                // pwd(전화번호) 숫자만 추출 및 트리밍 (프론트에서도 처리하여 전송)
                const cleanPwd = password.trim().replace(/[^\d]/g, '');

                // 서버 API 호출하여 비밀번호 검증
                const res = await http.post('/choiMath/share/detail-with-auth', {
                    id,
                    pwd: cleanPwd,
                    type
                });

                if (res.data && !res.data.error) {
                    setIsAuthorized(true);
                    sessionStorage.setItem(`kakao_share_auth_${id}`, 'true');
                } else {
                    setError('비밀번호가 일치하지 않거나 접근 권한이 없습니다.');
                }
            } catch (err: any) {
                console.error('Auth error:', err);
                const status = err.response?.status;
                const message = err.response?.data?.message;

                if (status === 401) {
                    setError('비밀번호가 일치하지 않습니다.');
                } else if (status === 404) {
                    setError('존재하지 않는 게시글이거나 만료된 링크입니다.');
                } else if (status === 400) {
                    setError('필수 입력 정보가 누락되었습니다.');
                } else {
                    setError(message || '인증 처리 중 오류가 발생했습니다.');
                }
            } finally {
                setLoading(false);
            }
        };

        if (isAuthorized) {
            return <WrappedComponent {...props} />;
        }

        return (
            <div className="flex align-items-center justify-content-center min-h-screen p-3 bg-gray-100">
                <Card
                    title="비공개 콘텐츠"
                    subTitle="접근을 위해 비밀번호를 입력해주세요. 전화번호 ex) 01012345678"
                    style={{ width: '100%', maxWidth: '400px' }}
                    className="shadow-4"
                >
                    <div className="flex flex-column gap-3 mt-2">
                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">
                                <i className="pi pi-lock"></i>
                            </span>
                            <InputText
                                type="password"
                                placeholder="비밀번호 입력 (숫자)"
                                value={password}
                                onChange={(e) => setPassword(e.target.value.replace(/[^0-9]/g, ''))}
                                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                                keyfilter="num"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className={error ? 'p-invalid' : ''}
                                disabled={loading}
                            />
                        </div>
                        {error && <small className="p-error font-bold">{error}</small>}
                        <Button
                            label={loading ? '확인 중...' : '인증하기'}
                            icon={loading ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
                            onClick={handleVerify}
                            disabled={loading}
                        />
                    </div>
                    <div className="mt-4 text-center text-xs text-500">
                        * 올바른 비밀번호(전화번호)를 입력해야 내용을 볼 수 있습니다.
                    </div>
                </Card>
            </div>
        );
    };

    PasswordProtectedComponent.displayName = `WithPasswordProtection(${
        WrappedComponent.displayName || WrappedComponent.name || 'Component'
    })`;

    return PasswordProtectedComponent;
};

export default withPasswordProtection;
