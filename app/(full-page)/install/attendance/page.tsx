'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import Link from 'next/link';

export default function InstallAttendancePage() {
    const router = useRouter();
    const [isStandalone, setIsStandalone] = useState(false);
    const [isIos, setIsIos] = useState(false);
    const [isKakao, setIsKakao] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // 1. 이미 홈 화면 PWA(standalone)로 실행된 경우 즉시 출석부 본 페이지로 자동 이동
        const standaloneMode =
            window.matchMedia('(display-mode: standalone)').matches ||
            window.matchMedia('(display-mode: fullscreen)').matches ||
            window.matchMedia('(display-mode: minimal-ui)').matches ||
            ('standalone' in navigator && (navigator as any).standalone === true) ||
            document.referrer.includes('android-app://');

        if (standaloneMode) {
            setIsStandalone(true);
            router.replace('/manual');
            return;
        }

        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsIos(/iphone|ipad|ipod/.test(userAgent));
        setIsKakao(/kakaotalk/i.test(userAgent));
    }, [router]);

    const handleCopyUrl = async () => {
        try {
            if (typeof window !== 'undefined') {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(window.location.href);
                } else {
                    const input = document.createElement('input');
                    input.value = window.location.href;
                    document.body.appendChild(input);
                    input.select();
                    document.execCommand('copy');
                    document.body.removeChild(input);
                }
                alert(
                    '설치 주소가 복사되었습니다!\n크롬(Chrome)이나 사파리(Safari) 브라우저를 열고 주소창에 붙여넣어 주세요.'
                );
            }
        } catch (_) {
            alert('주소 복사에 실패했습니다. 브라우저 주소창에서 링크를 복사해 주세요.');
        }
    };

    if (isStandalone) {
        return (
            <div className="flex align-items-center justify-content-center min-h-screen surface-ground p-4">
                <div className="text-center text-700">
                    <i className="pi pi-spin pi-spinner text-3xl mb-3 text-primary" />
                    <p className="font-bold">출석부 앱으로 이동 중입니다...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex align-items-center justify-content-center min-h-screen surface-ground p-3">
            <div
                className="surface-card p-4 md:p-5 border-round-3xl shadow-4 text-center w-full"
                style={{ maxWidth: '420px' }}
            >
                {/* 1. 앱 아이콘 */}
                <div className="flex justify-content-center mb-3">
                    <img
                        src="/icons/icon-ios-1024x1024.png"
                        alt="출석부 아이콘"
                        width={84}
                        height={84}
                        className="border-round-2xl shadow-3"
                        style={{ objectFit: 'cover' }}
                    />
                </div>

                {/* 2. 타이틀 & 설명 */}
                <h2 className="text-xl md:text-2xl font-bold text-900 m-0 mb-2">출석부 전용 앱 설치</h2>
                <p className="text-sm text-600 line-height-3 m-0 mb-4">
                    저장공간을 거의 차지하지 않는 가벼운 홈 화면 바로가기 웹앱입니다.
                    <br />
                    설치 후 홈 화면 아이콘으로 편리하게 출석부를 이용하세요.
                </p>

                {/* 3. 환경별 설치 안내 박스 */}
                <div className="p-3 border-round-2xl surface-100 text-xs text-700 mb-4 text-left line-height-3 border-1 surface-border">
                    {isKakao ? (
                        <>
                            <div className="flex align-items-center gap-2 font-bold text-orange-600 mb-1">
                                <i className="pi pi-exclamation-triangle" />
                                <span>카카오톡 인앱 브라우저 안내</span>
                            </div>
                            카카오톡 내부에서는 홈 화면 추가가 지원되지 않습니다. 아래 <b>[링크 복사하기]</b>를 눌러{' '}
                            <b>크롬(Chrome)</b>이나 <b>사파리(Safari)</b>에서 열어주세요.
                        </>
                    ) : isIos ? (
                        <>
                            <div className="flex align-items-center gap-2 font-bold text-900 mb-1">
                                <i className="pi pi-apple" />
                                <span>아이폰(iOS) 사파리 설치 방법</span>
                            </div>
                            사파리 브라우저 하단{' '}
                            <span className="font-bold text-primary">
                                [공유 <i className="pi pi-share-alt" />]
                            </span>{' '}
                            버튼을 누른 후, <span className="font-bold text-primary">[홈 화면에 추가]</span>를 선택해
                            주세요.
                        </>
                    ) : (
                        <>
                            <div className="flex align-items-center gap-2 font-bold text-900 mb-1">
                                <i className="pi pi-android" />
                                <span>안드로이드 / 크롬 설치 방법</span>
                            </div>
                            화면 하단 팝업의 <b>[앱 설치하기]</b>를 누르시거나, 브라우저 우측 상단 메뉴(<b>⋮</b>) &gt;{' '}
                            <b>[앱 설치]</b> 또는 <b>[홈 화면에 추가]</b>를 눌러주세요.
                        </>
                    )}
                </div>

                {/* 4. 액션 버튼 */}
                <div className="flex flex-column gap-2">
                    {isKakao ? (
                        <Button
                            label="설치 링크 복사하기"
                            icon="pi pi-copy"
                            severity="warning"
                            className="w-full font-bold py-3 border-round-xl"
                            onClick={handleCopyUrl}
                        />
                    ) : null}

                    <Link href="/manual" className="no-underline w-full">
                        <Button
                            label="웹으로 바로 이동"
                            icon="pi pi-arrow-right"
                            iconPos="right"
                            outlined
                            className="w-full font-bold py-3 border-round-xl"
                        />
                    </Link>
                </div>
            </div>
        </div>
    );
}
