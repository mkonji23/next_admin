/* eslint-disable @next/next/no-img-element */
'use client';
import { useRouter } from 'next/navigation';
import React, { useContext, useState } from 'react';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import useAuth from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { requestFcmToken } from '@/lib/firebase';
import { useHttp } from '@/util/axiosInstance';
const LoginPage = () => {
    const { login } = useAuth();
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const { layoutConfig } = useContext(LayoutContext);
    const { showToast } = useToast();
    const { post } = useHttp();

    const router = useRouter();
    const containerClassName = classNames(
        'surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden',
        { 'p-input-filled': layoutConfig.inputStyle === 'filled' }
    );

    // 한글 자판 위치를 영문 자판 위치로 매핑하는 함수
    const korToEng = (text: string) => {
        const cho = ['r', 'R', 's', 'e', 'E', 'f', 'a', 'q', 'Q', 't', 'T', 'd', 'w', 'W', 'c', 'z', 'x', 'v', 'g'];
        const jung = [
            'k',
            'o',
            'i',
            'O',
            'j',
            'p',
            'u',
            'P',
            'h',
            'hk',
            'ho',
            'hl',
            'y',
            'n',
            'nj',
            'np',
            'nl',
            'b',
            'm',
            'ml',
            'l'
        ];
        const jong = [
            '',
            'r',
            'R',
            'rt',
            's',
            'sw',
            'sg',
            'e',
            'f',
            'fr',
            'fa',
            'fq',
            'ft',
            'fx',
            'fv',
            'fg',
            'a',
            'q',
            'qt',
            't',
            'T',
            'd',
            'w',
            'c',
            'z',
            'x',
            'v',
            'g'
        ];
        const singleJamo: { [key: string]: string } = {
            ㄱ: 'r',
            ㄲ: 'R',
            ㄴ: 's',
            ㄷ: 'e',
            ㄸ: 'E',
            ㄹ: 'f',
            ㅁ: 'a',
            ㅂ: 'q',
            ㅃ: 'Q',
            ㅅ: 't',
            ㅆ: 'T',
            ㅇ: 'd',
            ㅈ: 'w',
            ㅉ: 'W',
            ㅊ: 'c',
            ㅋ: 'z',
            ㅌ: 'x',
            ㅍ: 'v',
            ㅎ: 'g',
            ㅏ: 'k',
            ㅐ: 'o',
            ㅑ: 'i',
            ㅒ: 'O',
            ㅓ: 'j',
            ㅔ: 'p',
            ㅕ: 'u',
            ㅖ: 'P',
            ㅗ: 'h',
            ㅘ: 'hk',
            ㅙ: 'ho',
            ㅚ: 'hl',
            ㅛ: 'y',
            ㅜ: 'n',
            ㅝ: 'nj',
            ㅞ: 'np',
            ㅟ: 'nl',
            ㅠ: 'b',
            ㅡ: 'm',
            ㅢ: 'ml',
            ㅣ: 'l'
        };

        let result = '';
        for (let i = 0; i < text.length; i++) {
            const code = text.charCodeAt(i);
            if (code >= 0xac00 && code <= 0xd7a3) {
                const base = code - 0xac00;
                const c = Math.floor(base / 28 / 21);
                const ju = Math.floor((base / 28) % 21);
                const jo = base % 28;
                result += cho[c] + jung[ju] + jong[jo];
            } else if (singleJamo[text[i]]) {
                result += singleJamo[text[i]];
            } else {
                result += text[i];
            }
        }
        return result;
    };

    const signIn = async () => {
        const res = await login({ userId: email, password: password });
        if (res) {
            // 로그인 성공 후 FCM 토큰 요청
            const token = await requestFcmToken();
            if (token) {
                try {
                    // 서버에 토큰 저장 요청 (API가 구현되어 있다고 가정)
                    await post('/db/saveToken', {
                        token,
                        type: process.env.NODE_ENV === 'development' ? 'debug' : 'release'
                    });
                } catch (error) {
                    console.error('Failed to update FCM token on server:', error);
                }
            }
            router.push('/');
        }
    };

    return (
        <div className={containerClassName}>
            <div className="flex flex-column align-items-center justify-content-center">
                <img
                    src={`/layout/images/logo-${layoutConfig.colorScheme === 'light' ? 'dark' : 'white'}.svg`}
                    alt="Sakai logo"
                    className="mb-5 w-6rem flex-shrink-0"
                />
                <div
                    style={{
                        borderRadius: '56px',
                        padding: '0.3rem',
                        background: 'linear-gradient(180deg, var(--primary-color) 100%, rgba(33, 150, 243, 0) 30%)'
                    }}
                >
                    <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                signIn();
                            }}
                        >
                            <label htmlFor="email1" className="block text-900 text-xl font-medium mb-2">
                                ID
                            </label>
                            <InputText
                                value={email}
                                id="email1"
                                type="text"
                                inputMode="latin"
                                placeholder="아이디"
                                className="w-full md:w-30rem mb-5"
                                style={{ padding: '1rem' }}
                                onChange={(e) => setEmail(korToEng(e.target.value).replace(/[^a-zA-Z0-9_-]/g, ''))}
                            />

                            <label htmlFor="password1" className="block text-900 font-medium text-xl mb-2">
                                Password
                            </label>
                            <Password
                                inputId="password1"
                                value={password}
                                onChange={(e) => setPassword(korToEng(e.target.value))}
                                pt={{
                                    input: { inputMode: 'latin' }
                                }}
                                placeholder="비밀번호"
                                toggleMask
                                feedback={false}
                                className="w-full mb-5"
                                inputClassName="w-full p-3 md:w-30rem"
                                maxLength={30}
                            ></Password>

                            <div className="flex align-items-center justify-content-between mb-5 gap-5">
                                {/* <a
                                    className="font-medium no-underline ml-2 text-right cursor-pointer"
                                    style={{ color: 'var(--primary-color)' }}
                                >
                                    비밀번호 찾기 */}
                                {/* </a> */}
                                <Button label="Sign In" type="submit" className="w-full p-3 text-xl"></Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
