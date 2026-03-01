'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { Divider } from 'primereact/divider';
import { Button } from 'primereact/button';
import { useToast } from '@/hooks/useToast';
import Link from 'next/link';

const KakaoCallbackContent = () => {
    const searchParams = useSearchParams();
    const { showToast } = useToast();
    
    const [loading, setLoading] = useState(false);
    const [tokenData, setTokenData] = useState<any>(null);
    const [apiError, setApiError] = useState<any>(null);

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    useEffect(() => {
        if (code && !tokenData && !apiError && !loading) {
            handleGetToken(code);
        }
    }, [code]);

    const handleGetToken = async (authCode: string) => {
        setLoading(true);
        setApiError(null);
        try {
            const response = await fetch('/api/auth/kakao/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: authCode }),
            });
            const data = await response.json();
            if (!response.ok) {
                setApiError(data);
            } else {
                setTokenData(data);
                showToast({
                    severity: 'success',
                    summary: '토큰 발급 완료',
                    detail: '카카오 엑세스 토큰을 성공적으로 가져왔습니다.'
                });
            }
        } catch (err) {
            setApiError({ error: 'Failed to fetch token', error_description: '네트워크 오류가 발생했습니다.' });
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string | null, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            showToast({
                severity: 'success',
                summary: '복사 완료',
                detail: `${label}이(가) 클립보드에 복사되었습니다.`
            });
        });
    };

    const renderField = (label: string, value: string | null, copyable: boolean = false) => (
        <div className="field mb-4">
            <label className="block text-900 font-bold mb-2">{label}</label>
            {copyable && value ? (
                <div className="p-inputgroup">
                    <InputText value={value} readOnly className="surface-100" />
                    <Button icon="pi pi-copy" onClick={() => copyToClipboard(value, label)} tooltip="복사하기" />
                </div>
            ) : (
                <InputText value={value || 'N/A'} readOnly className="w-full p-3 surface-100" />
            )}
        </div>
    );

    return (
        <div className="surface-ground flex flex-column align-items-center justify-content-center min-h-screen p-4">
            <Card title="카카오 인증 및 토큰 확인" className="w-full md:w-35rem shadow-2 mb-4" style={{ borderRadius: '12px' }}>
                <div className="p-fluid">
                    {/* 1. 인가 코드 섹션 */}
                    <div className="mb-4">
                        <Message severity="info" text="인가 코드를 성공적으로 수신했습니다." className="w-full justify-content-start" />
                    </div>
                    {renderField('인가 코드 (code)', code, true)}
                    {state && renderField('상태 값 (state)', state)}

                    {error && (
                        <div className="mb-4">
                            <Message severity="error" text={`인증 에러: ${errorDescription || error}`} className="w-full justify-content-start" />
                        </div>
                    )}

                    <Divider />

                    {/* 2. 토큰 섹션 */}
                    <h3 className="text-900 font-bold mb-3 mt-4">발급된 토큰 정보</h3>
                    
                    {loading && (
                        <div className="flex justify-content-center p-4">
                            <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
                            <span className="ml-3">토큰 발급 중...</span>
                        </div>
                    )}

                    {apiError && (
                        <div className="mb-4">
                            <Message severity="error" text={`토큰 발급 실패: ${apiError.error_description || apiError.error || '알 수 없는 오류'}`} className="w-full justify-content-start" />
                            <Button label="다시 시도" icon="pi pi-refresh" onClick={() => code && handleGetToken(code)} className="mt-2 p-button-outlined p-button-sm" />
                        </div>
                    )}

                    {tokenData && (
                        <>
                            {renderField('Access Token', tokenData.access_token, true)}
                            {renderField('Refresh Token', tokenData.refresh_token, true)}
                            {renderField('Token Type', tokenData.token_type)}
                            {renderField('Expires In', String(tokenData.expires_in))}
                            {tokenData.scope && renderField('Scope', tokenData.scope)}
                        </>
                    )}

                    <Divider className="mt-5" />
                    
                    <div className="flex justify-content-center">
                        <Link href="/auth/login">
                            <Button label="로그인 페이지로 돌아가기" icon="pi pi-arrow-left" className="p-button-text" />
                        </Link>
                    </div>
                </div>
            </Card>
        </div>
    );
};

const KakaoCallbackPage = () => {
    return (
        <Suspense fallback={
            <div className="flex align-items-center justify-content-center min-h-screen">
                <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
            </div>
        }>
            <KakaoCallbackContent />
        </Suspense>
    );
};

export default KakaoCallbackPage;
