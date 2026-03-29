'use client';

import React, { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Sidebar } from 'primereact/sidebar';

export default function PwaInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIos, setIsIos] = useState(false);
    const [isStandalone, setIsStandalone] = useState(true);

    useEffect(() => {
        // 이미 PWA(독립 앱) 모드로 실행 중인지 확인
        const isAppMode = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && (navigator as any).standalone);
        setIsStandalone(isAppMode);

        if (isAppMode) return;

        // iOS 기기 여부 감지
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIos(isIosDevice);

        if (isIosDevice) {
            // iOS는 브라우저 자동 프롬프트를 지원하지 않으므로 수동 안내를 띄웁니다.
            const hasSeenPrompt = localStorage.getItem('hasSeenPwaPrompt');
            if (!hasSeenPrompt) {
                setTimeout(() => setIsVisible(true), 3000); // 3초 후 표시
            }
        }

        // 안드로이드/크롬 설치 프롬프트 이벤트 가로채기
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault(); // 기본 브라우저 프롬프트(미니 인포바 등) 차단
            setDeferredPrompt(e);

            const hasSeenPrompt = localStorage.getItem('hasSeenPwaPrompt');
            if (!hasSeenPrompt) {
                setIsVisible(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // 커스텀 설치 프롬프트 띄우기
        deferredPrompt.prompt();

        // 사용자가 설치 혹은 취소할 때까지 대기
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        setDeferredPrompt(null);
        setIsVisible(false);
    };

    const handleClose = () => {
        setIsVisible(false);
        // 하루 동안 다시 보지 않기 (원하시면 옵션 조정 가능)
        localStorage.setItem('hasSeenPwaPrompt', 'true');
    };

    if (isStandalone) return null;

    return (
        <Sidebar 
            visible={isVisible} 
            position="bottom" 
            onHide={handleClose} 
            showCloseIcon={false}
            style={{ height: 'auto', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}
            className="p-3 m-0"
        >
            <div className="flex flex-column align-items-center text-center">
                <i className="pi pi-download text-4xl text-primary mb-3"></i>
                <h3 className="m-0 mb-2">빠르고 편리한 전용 앱 설치</h3>
                <p className="m-0 mb-4 text-color-secondary">
                    {isIos ? (
                        <>하단 브라우저 메뉴에서 <i className="pi pi-share-alt mx-1"></i> [공유] 버튼을 누른 후,<br/> <b>[홈 화면에 추가]</b>를 선택해 주세요!</>
                    ) : (
                        <>단 한 번의 터치로 바탕화면에 바로가기 앱을 추가해 보세요.</>
                    )}
                </p>
                <div className="flex w-full gap-2">
                    <Button label="닫기" severity="secondary" outlined className="flex-1" onClick={handleClose} />
                    {!isIos && <Button label="앱 설치하기" className="flex-1" onClick={handleInstallClick} />}
                </div>
            </div>
        </Sidebar>
    );
}
