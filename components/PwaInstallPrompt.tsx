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

        // student-status에서 설치 완료 이력이 있는 경우
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

        // 디바이스 및 브라우저 환경 감지
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        const isKakaoTalk = /kakaotalk/i.test(userAgent);
        setIsIos(isIosDevice);
        setIsKakao(isKakaoTalk);

        if (isStudentStatus) {
            // 칭찬현황 페이지 진입 시: 설치될 때까지 항상 팝업 노출 (hasSeenPwaPrompt 무시)
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 700);
            return () => clearTimeout(timer);
        } else {
            // 기타 페이지: 기존처럼 hasSeenPwaPrompt가 없는 경우에만 1회 안내
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
            e.preventDefault(); // 기본 브라우저 프롬프트(미니 인포바 등) 차단
            setDeferredPrompt(e);
            deferredPromptRef.current = e;

            if (checkIsAppInstalled()) return;

            if (isStudentStatus) {
                // 칭찬현황에서는 진입 시 항상 표시
                setIsVisible(true);
            } else {
                const hasSeenPrompt = localStorage.getItem('hasSeenPwaPrompt');
                if (!hasSeenPrompt) {
                    setIsVisible(true);
                }
            }
        };

        const handleAppInstalled = () => {
            console.log('PWA app installed successfully');
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
                // 커스텀 설치 프롬프트 띄우기
                promptEvent.prompt();
                const { outcome } = await promptEvent.userChoice;

                if (outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                    localStorage.setItem('pwa_installed_student_status', 'true');
                    setIsStandalone(true);
                    setIsVisible(false);
                } else {
                    console.log('User dismissed the install prompt');
                }
            } catch (err) {
                console.error('Install prompt error:', err);
                setShowManualGuide(true);
            }

            setDeferredPrompt(null);
            deferredPromptRef.current = null;
        } else {
            // 브라우저에서 beforeinstallprompt 이벤트를 지원하지 않거나 이미 소비된 경우 수동 가이드 안내
            setShowManualGuide(true);
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        setShowManualGuide(false);
        if (!isStudentStatus) {
            localStorage.setItem('hasSeenPwaPrompt', 'true');
        }
        // 칭찬현황(student-status)에서는 영구 차단 플래그를 저장하지 않으므로 설치 전까지 다음 진입 시 다시 뜸
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
            style={{ height: 'auto', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}
            className="p-3 m-0"
        >
            <div className="flex flex-column align-items-center text-center">
                {/* 1. 앱 아이콘 노출 */}
                <img
                    src={appIconSrc}
                    alt="App Icon"
                    width={64}
                    height={64}
                    className="border-round-2xl shadow-3 mb-2"
                    style={{ objectFit: 'cover' }}
                />

                <h3 className="m-0 mb-1 font-bold text-lg text-900">
                    {isStudentStatus ? '칭찬현황 전용 PWA 앱 설치' : '빠르고 편리한 전용 PWA 앱 설치'}
                </h3>

                {/* 2. 실제 스토어 앱이 아닌 웹 PWA 앱임을 명확히 인지시키는 문구 */}
                <p className="m-0 mb-2 text-xs text-600 line-height-3" style={{ maxWidth: '340px' }}>
                    앱스토어에서 다운로드하는 무거운 앱이 아닌, 기기 용량을 차지하지 않는 <b>초경량 PWA(홈 화면 바로가기 앱)</b>입니다.
                </p>

                {/* 3. 기기별 설치 방법 안내 */}
                <div className="p-2 px-3 border-round-xl surface-100 text-xs text-700 mb-2 w-full text-center line-height-3" style={{ maxWidth: '380px' }}>
                    {isKakao ? (
                        <>
                            카카오톡 브라우저에서는 우측 하단/상단 <b>[···]</b> 메뉴 &gt; <b>[다른 브라우저로 열기]</b>를 선택하셔야 홈 화면에 추가할 수 있습니다.
                        </>
                    ) : isIos ? (
                        <>
                            하단 브라우저 메뉴에서 <i className="pi pi-share-alt mx-1 text-primary"></i> <b>[공유]</b> 버튼을 누른 후 <b>[홈 화면에 추가]</b>를 선택해 주세요!
                        </>
                    ) : (
                        <>
                            버튼 한 번으로 홈 화면에 전용 앱을 추가하여 순공 스톱워치와 칭찬현황을 바로 열어보세요.
                        </>
                    )}
                </div>

                {/* 4. 설치할 때까지 계속 팝업이 뜬다는 안내 문구 */}
                <div className="flex align-items-center justify-content-center gap-1 text-xs text-orange-600 font-semibold mb-3">
                    <i className="pi pi-info-circle text-xs" />
                    <span>홈 화면에 앱을 추가(설치)할 때까지 접속 시 계속 팝업이 뜹니다.</span>
                </div>

                {showManualGuide && !isIos && (
                    <div className="p-2 border-round surface-200 text-xs text-800 mb-3 w-full text-center" style={{ maxWidth: '380px' }}>
                        💡 브라우저 우측 상단 메뉴(⋮)에서 <b>[앱 설치]</b> 또는 <b>[홈 화면에 추가]</b>를 눌러주세요.
                    </div>
                )}

                <div className="flex w-full gap-2" style={{ maxWidth: '380px' }}>
                    <Button
                        label={isIos ? '확인' : '닫기'}
                        severity="secondary"
                        outlined
                        className="flex-1 font-bold"
                        onClick={handleClose}
                    />
                    {!isIos && (
                        <Button
                            label="PWA 앱 설치하기"
                            icon="pi pi-download"
                            className="flex-1 font-bold"
                            onClick={handleInstallClick}
                        />
                    )}
                </div>
            </div>
        </Sidebar>
    );
}
