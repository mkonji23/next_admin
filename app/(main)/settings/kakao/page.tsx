'use client';

import React from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { Divider } from 'primereact/divider';
import { withSecurity } from '@/components/hoc/withSecurity';

const KakaoSettingsPage = () => {
    // These should ideally be in environment variables
    const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || '82c0e86b245749f7ba36a73a6a908a73';
    const KAKAO_REDIRECT_URI = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || 'http://localhost:4000/auth/kakao/callback';

    const handleKakaoAuth = () => {
        const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${KAKAO_REDIRECT_URI}&response_type=code`;
        window.location.href = kakaoAuthUrl;
    };

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <h5>카카오 토큰 발급 설정</h5>
                    <p>카카오 로그인 연동을 위해 인가 코드를 먼저 발급받아야 합니다.</p>
                    
                    <div className="flex flex-column gap-3 mt-4">
                        <Card title="인가 코드 발급 안내" subTitle="Authorization Code" className="shadow-1">
                            <div className="flex flex-column gap-2">
                                <div className="flex justify-content-between">
                                    <span className="font-bold">REST API Key:</span>
                                    <span className="text-primary">{KAKAO_CLIENT_ID}</span>
                                </div>
                                <div className="flex justify-content-between">
                                    <span className="font-bold">Redirect URI:</span>
                                    <span className="text-primary">{KAKAO_REDIRECT_URI}</span>
                                </div>
                                
                                <Divider />
                                
                                <div className="p-3 surface-50 border-round text-sm line-height-3">
                                    <ul className="m-0 pl-3">
                                        <li>위 정보가 카카오 내 애플리케이션 설정과 일치해야 합니다.</li>
                                        <li>아래 버튼 클릭 시 카카오 로그인 화면으로 이동합니다.</li>
                                        <li>로그인 성공 후 콜백 페이지에서 인가 코드를 확인할 수 있습니다.</li>
                                    </ul>
                                </div>
                                
                                <div className="mt-4 flex justify-content-center">
                                    <Button 
                                        label="카카오 인가 코드 받기" 
                                        icon="pi pi-external-link" 
                                        onClick={handleKakaoAuth} 
                                        className="p-button-warning p-button-lg w-full md:w-auto px-6 font-bold"
                                        style={{ backgroundColor: '#FEE500', color: '#000000', border: 'none' }}
                                    />
                                </div>
                            </div>
                        </Card>
                        
                        <Message 
                            severity="info" 
                            text="인가 코드를 받은 후, 해당 코드를 사용하여 엑세스 토큰을 발급받을 수 있습니다." 
                            className="mt-3" 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default withSecurity(KakaoSettingsPage);
