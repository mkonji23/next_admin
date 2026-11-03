'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from 'primereact/button';
import { Sidebar } from 'primereact/sidebar';

export default function PwaInstallPrompt() {
    const pathname = usePathname();
    const isStudentStatus = pathname === '/student-status' || pathname?.startsWith('/student-status');

    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const deferredPromptRef = useRef<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIos, setIsIos] = useState(false);
    const [isKakao, setIsKakao] = useState(false);
    const [isStandalone, setIsStandalone] = useState(true);
    const [showManualGuide, setShowManualGuide] = useState(false);

    // 이미 PWA(독립 앱) 모드로 실행 중인지 확인
    const checkIsAppInstalled = () => {
        if (typeof window === 'undefined') return true;
        const isAppMode =
            window.matchMedia('(display-mode: standalone)').matches ||
            window.matchMedia('(display-mode: fullscreen)').matches ||
            window.matchMedia('(display-mode: minimal-ui)').matches ||
            ('standalone' in navigator && (navigator as any).standalone === true) ||
            document.referrer.includes('android-app://');

        if (isAppMode) return true;

        if (localStorage.getItem('pwa_installed_student_status') === 'true') {
            return true;
        }

        return false;
    };

    // 진입 시 감지 및 표시 로직
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const isApp = checkIsAppInstalled();
        setIsStandalone(isApp);

        if (isApp) {
            setIsVisible(false);
            return;
        }

        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        const isKakaoTalk = /kakaotalk/i.test(userAgent);
        setIsIos(isIosDevice);
        setIsKakao(isKakaoTalk);

        if (isStudentStatus) {
            // 칭찬현황 페이지 진입 시 설치될 때까지 항상 팝업 표시
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 700);
            return () => clearTimeout(timer);
        } else {
            const hasSeenPrompt = localStorage.getItem('hasSeenPwaPrompt');
            if (!hasSeenPrompt && isIosDevice) {
                const timer = setTimeout(() => setIsVisible(true), 3000);
                return () => clearTimeout(timer);
            }
        }
    }, [pathname, isStudentStatus]);

    // PWA 설치 이벤트(beforeinstallprompt) 및 설치 완료(appinstalled) 이벤트 리스너 등록
    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            deferredPromptRef.current = e;

            if (checkIsAppInstalled()) return;

            if (isStudentStatus) {
                setIsVisible(true);
            } else {
                const hasSeenPrompt = localStorage.getItem('hasSeenPwaPrompt');
                if (!hasSeenPrompt) {
                    setIsVisible(true);
                }
            }
        };

        const handleAppInstalled = () => {
            setIsStandalone(true);
            setIsVisible(false);
            localStorage.setItem('pwa_installed_student_status', 'true');
            setDeferredPrompt(null);
            deferredPromptRef.current = null;
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, [isStudentStatus]);

    const handleInstallClick = async () => {
        const promptEvent = deferredPrompt || deferredPromptRef.current;
        if (promptEvent) {
            try {
                promptEvent.prompt();
                const { outcome } = await promptEvent.userChoice;

                if (outcome === 'accepted') {
                    localStorage.setItem('pwa_installed_student_status', 'true');
                    setIsStandalone(true);
                    setIsVisible(false);
                }
            } catch (err) {
                setShowManualGuide(true);
            }

            setDeferredPrompt(null);
            deferredPromptRef.current = null;
        } else {
            setShowManualGuide(true);
        }
    };

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
                alert('주소가 복사되었습니다!\n크롬(Chrome)이나 사파리(Safari) 브라우저를 열고 주소창에 붙여넣어 주세요.');
            }
        } catch (_) {
            alert('주소 복사에 실패했습니다. 브라우저 주소창에서 링크를 복사해 주세요.');
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        setShowManualGuide(false);
        if (!isStudentStatus) {
            localStorage.setItem('hasSeenPwaPrompt', 'true');
        }
    };

    if (isStandalone) return null;

    const appIconSrc = isStudentStatus
        ? '/icons/icon-ios-1024x1024_red.png'
        : '/icons/icon-ios-1024x1024.png';

    return (
        <Sidebar 
            visible={isVisible} 
            position="bottom" 
            onHide={handleClose} 
            showCloseIcon={false}
            baseZIndex={12000}
            style={{ height: 'auto', borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }}
            className="p-3 m-0"
        >
            <div className="flex flex-column align-items-center text-center">
                {/* 1. 앱 아이콘 */}
                <img
                    src={appIconSrc}
                    alt="App Icon"
                    width={56}
                    height={56}
                    className="border-round-xl shadow-2 mb-2"
                    style={{ objectFit: 'cover' }}
                />

                {/* 2. 간결한 타이틀 */}
                <h3 className="m-0 mb-1 font-bold text-base text-900">
                    {isStudentStatus ? '칭찬현황 PWA 앱 설치' : '전용 PWA 앱 설치'}
                </h3>

                {/* 3. 간단명료한 본문 안내 (장황함 제거 & 카카오톡 브라우저 대응) */}
                <div className="m-0 mb-2 text-xs text-700 line-height-3 text-center" style={{ maxWidth: '340px' }}>
                    {isKakao ? (
                        <>
                            카카오톡에서는 앱 설치가 지원되지 않습니다.<br />
                            <b>크롬(Chrome)</b>이나 <b>사파리(Safari)</b> 등 인터넷 브라우저로 열어서 설치해 주세요.
                        </>
                    ) : isIos ? (
                        <>
                            용량을 차지하지 않는 가벼운 웹(PWA) 바로가기 앱입니다.<br />
                            하단 <b>[공유 <i className="pi pi-share-alt"></i>]</b> &gt; <b>[홈 화면에 추가]</b>를 눌러주세요.
                        </>
                    ) : (
                        <>
                            용량을 차지하지 않는 가벼운 웹(PWA) 바로가기 앱입니다.<br />
                            홈 화면에 추가하여 빠르고 편리하게 확인해 보세요.
                        </>
                    )}
                </div>

                {/* 4. 설치 전까지 계속 뜬다는 간결한 안내 */}
                <p className="m-0 mb-3 text-xs text-orange-600 font-medium">
                    * 홈 화면에 앱을 설치(추가)할 때까지 접속 시 계속 뜹니다.
                </p>

                {showManualGuide && !isIos && !isKakao && (
                    <div className="p-2 border-round surface-200 text-xs text-800 mb-3 w-full text-center" style={{ maxWidth: '340px' }}>
                        💡 브라우저 메뉴(⋮)에서 <b>[앱 설치]</b> 또는 <b>[홈 화면에 추가]</b>를 눌러주세요.
                    </div>
                )}

                {/* 5. 버튼 구성 */}
                <div className="flex w-full gap-2" style={{ maxWidth: '340px' }}>
                    <Button
                        label={isIos ? '확인' : '닫기'}
                        severity="secondary"
                        outlined
                        className="flex-1 font-bold"
                        onClick={handleClose}
                    />
                    {isKakao ? (
                        <Button
                            label="링크 복사하기"
                            icon="pi pi-copy"
                            className="flex-1 font-bold"
                            onClick={handleCopyUrl}
                        />
                    ) : (
                        !isIos && (
                            <Button
                                label="앱 설치하기"
                                icon="pi pi-download"
                                className="flex-1 font-bold"
                                onClick={handleInstallClick}
                            />
                        )
                    )}
                </div>
            </div>
        </Sidebar>
    );
}
