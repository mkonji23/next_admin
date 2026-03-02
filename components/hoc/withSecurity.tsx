'use client';

import React, { useState, ComponentType } from 'react';
import { Card } from 'primereact/card';
import { Password } from 'primereact/password';
import { Message } from 'primereact/message';
import { Button } from 'primereact/button';

/**
 * Higher-Order Component that adds a security password check before rendering the wrapped component.
 * @param WrappedComponent The component to be protected.
 * @returns A new component that renders a password check form or the wrapped component.
 */
export function withSecurity<P extends object>(WrappedComponent: ComponentType<P>) {
    return function SecurityWrapper(props: P) {
        const [isAuthorized, setIsAuthorized] = useState(false);
        const [inputPassword, setInputPassword] = useState('');
        const [error, setError] = useState(false);

        const handlePasswordSubmit = () => {
            // Ideally this should be checked against an environment variable or a secure API
            const SECURITY_PASSWORD = process.env.NEXT_PUBLIC_SECURITY_PASSWORD || 'test1234';
            
            if (inputPassword === SECURITY_PASSWORD) {
                setIsAuthorized(true);
                setError(false);
            } else {
                setError(true);
            }
        };

        if (!isAuthorized) {
            return (
                <div className="flex align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
                    <Card title="보안 인증" subTitle="해당 메뉴에 접근하려면 비밀번호가 필요합니다." className="w-full md:w-30rem shadow-2">
                        <div className="flex flex-column gap-3">
                            <div className="field">
                                <label htmlFor="accessPassword" className="block font-bold mb-2">Password</label>
                                <Password 
                                    id="accessPassword"
                                    value={inputPassword} 
                                    onChange={(e) => setInputPassword(e.target.value)} 
                                    toggleMask 
                                    feedback={false}
                                    className="w-full"
                                    inputClassName="w-full p-3"
                                    placeholder="비밀번호를 입력하세요"
                                    onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                                />
                            </div>
                            {error && <Message severity="error" text="비밀번호가 일치하지 않습니다." />}
                            <Button label="확인" icon="pi pi-check" onClick={handlePasswordSubmit} className="w-full p-3 mt-2" />
                        </div>
                    </Card>
                </div>
            );
        }

        return <WrappedComponent {...props} />;
    };
}
