'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Sidebar } from 'primereact/sidebar';

export default function PwaInstallPrompt() {
    const pathname = usePathname();
    const router = useRouter();

    // 설치 전용 URL 여부 판별
    const isAttendanceInstall = pathname === '/install/attendance';
    const isStudentStatusInstall = pathname === '/install/student-status';
    const isInstallUrl = isAttendanceInstall || isStudentStatusInstall;

    // 대상 앱 종류 판별 ('student-status' vs 'attendance')
    const isStudentStatus =
        isStudentStatusInstall || pathname === '/student-status' || pathname?.startsWith('/student-status');
    const appName = isStudentStatus ? '칭찬현황' : '출석부';
    const appIconSrc = isStudentStatus ? '/icons/icon-ios-1024x1024_red.png' : '/icons/icon-ios-1024x1024.png';
    const targetWebUrl = isStudentStatus ? '/student-status' : '/manual';

    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const deferredPromptRef = useRef<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIos, setIsIos] = useState(false);
    const [isKakao, setIsKakao] = useState(false);
    const [isFirefox, setIsFirefox] = useState(false);
    const [isSamsung, setIsSamsung] = useState(false);
    const [isInAppBrowser, setIsInAppBrowser] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showManualGuide, setShowManualGuide] = useState(false);

    // 실제 홈 화면 앱(standalone 모드)으로 접속 중인지 판별
    const checkIsStandaloneMode = () => {
        if (typeof window === 'undefined') return false;
        return (
            window.matchMedia('(display-mode: standalone)').matches ||
            window.matchMedia('(display-mode: fullscreen)').matches ||
            window.matchMedia('(display-mode: minimal-ui)').matches ||
            ('standalone' in navigator && (navigator as any).standalone === true) ||
            document.referrer.includes('android-app://')
        );
    };

    // 진입 시 감지 및 표시 로직 (localStorage 플래그 대신 설치 전용 URL 여부로만 결정)
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const isApp = checkIsStandaloneMode();
        setIsStandalone(isApp);

        // 이미 홈 화면 아이콘을 통해 standalone 앱으로 실행 중인 경우 팝업 불필요
        if (isApp) {
            setIsVisible(false);
            return;
        }

        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        const isKakaoTalk = /kakaotalk/i.test(userAgent);
        const isFx = /firefox|fxios/i.test(userAgent);
        const isSamsungBrowser = /samsungbrowser/i.test(userAgent);
        const isOtherInApp = /line|inapp|instagram|fbav|daumapps/i.test(userAgent);

        setIsIos(isIosDevice);
        setIsKakao(isKakaoTalk);
        setIsFirefox(isFx);
        setIsSamsung(isSamsungBrowser);
        setIsInAppBrowser(isKakaoTalk || isOtherInApp);

        // 설치 전용 URL(/install/attendance, /install/student-status)에 접속한 경우 무조건 즉시 팝업 표시
        if (isInstallUrl) {
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 300);
            return () => clearTimeout(timer);
        } else {
            // 일반 웹 페이지에서는 불필요한 자동 팝업 차단
            setIsVisible(false);
        }
    }, [pathname, isInstallUrl]);

    // PWA 설치 이벤트(beforeinstallprompt) 및 설치 완료(appinstalled) 이벤트 리스너 등록
    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            deferredPromptRef.current = e;

            if (checkIsStandaloneMode()) return;

            // 설치 전용 URL에 접속 중이면 즉시 표시
            if (isInstallUrl) {
                setIsVisible(true);
            }
        };

        const handleAppInstalled = () => {
            setIsStandalone(true);
            setIsVisible(false);
            setDeferredPrompt(null);
            deferredPromptRef.current = null;
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, [isInstallUrl]);

    const handleInstallClick = async () => {
        const promptEvent = deferredPrompt || deferredPromptRef.current;
        if (promptEvent) {
            try {
                promptEvent.prompt();
                const { outcome } = await promptEvent.userChoice;

                if (outcome === 'accepted') {
                    setIsVisible(false);
                }
            } catch (err) {
                setShowManualGuide(true);
            }

            setDeferredPrompt(null);
            deferredPromptRef.current = null;
        } else {
            // 크롬 캐시/쿨다운 또는 파이어폭스/기타 브라우저로 beforeinstallprompt가 미발생한 경우 수동 가이드 표시
            setShowManualGuide(true);
        }
    };

    // 카카오톡 및 인앱 브라우저 탈출 -> 외부 브라우저(크롬, 사파리, 삼성인터넷 등)로 즉시 실행
    const handleOpenExternalBrowser = () => {
        if (typeof window === 'undefined') return;
        const currentUrl = window.location.href;
        const userAgent = window.navigator.userAgent.toLowerCase();

        // 1. 카카오톡 인앱 브라우저 탈출 스킴 (안드로이드, iOS 모두 지원)
        if (/kakaotalk/i.test(userAgent)) {
            window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(currentUrl)}`;
            return;
        }

        // 2. 안드로이드 환경 (기타 인앱 브라우저): 크롬 인텐트로 크롬 직접 실행
        if (/android/i.test(userAgent)) {
            const cleanUrl = currentUrl.replace(/^https?:\/\//i, '');
            window.location.href = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
            return;
        }

        // 3. iOS 또는 기타: 클립보드 복사 후 안내
        handleCopyUrl();
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
                alert(
                    '설치 주소가 복사되었습니다!\n크롬(Chrome), 삼성인터넷, 사파리(Safari) 등 기본 브라우저를 열고 주소창에 붙여넣어 주세요.'
                );
            }
        } catch (_) {
            alert('주소 복사에 실패했습니다. 브라우저 주소창에서 링크를 복사해 주세요.');
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        setShowManualGuide(false);
    };

    const handleGoToWeb = () => {
        setIsVisible(false);
        router.push(targetWebUrl);
    };

    // 실제 standalone 앱 모드로 실행 중이면 설치 프롬프트 렌더링 안 함
    if (isStandalone) return null;

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
                {/* 1. 앱 아이콘 */}
                <img
                    src={appIconSrc}
                    alt={`${appName} 아이콘`}
                    width={64}
                    height={64}
                    className="border-round-2xl shadow-3 mb-2"
                    style={{ objectFit: 'cover' }}
                />

                {/* 2. 간결한 타이틀 */}
                <h3 className="m-0 mb-1 font-bold text-lg text-900">{appName} 전용 앱 설치</h3>

                {/* 3. 간단명료한 본문 안내 (카카오톡, iOS, 파이어폭스, 일반 브라우저 대응) */}
                <div className="m-0 mb-3 text-xs text-700 line-height-3 text-center" style={{ maxWidth: '340px' }}>
                    {isInAppBrowser ? (
                        <>
                            카카오톡 등 메신저 내부에서는 홈 화면 앱 설치가 지원되지 않습니다.
                            <br />
                            아래 <b>[외부 브라우저로 열기]</b>를 누르면 <b>크롬 / 삼성인터넷 / 사파리</b>로 바로 연결되어 크롬처럼 설치할 수 있습니다.
                        </>
                    ) : isIos ? (
                        <>
                            저장공간을 거의 차지하지 않는 가벼운 홈 화면 웹앱입니다.
                            <br />
                            사파리 브라우저 하단{' '}
                            <b>
                                [공유 <i className="pi pi-share-alt"></i>]
                            </b>{' '}
                            &gt; <b>[홈 화면에 추가]</b>를 눌러주세요.
                        </>
                    ) : isFirefox ? (
                        <>
                            파이어폭스는 브라우저 메뉴를 통해 바로 설치할 수 있습니다.
                            <br />
                            주소창 옆 <b>[설치 아이콘]</b> 또는 브라우저 메뉴(<b>⋮</b>) &gt; <b>[설치]</b>를 눌러주세요.
                        </>
                    ) : (
                        <>
                            저장공간을 차지하지 않는 빠르고 가벼운 홈 화면 웹앱입니다.
                            <br />
                            <b>크롬, 삼성인터넷, 네이버 웨일, 엣지</b> 등에서 원클릭으로 설치됩니다.
                        </>
                    )}
                </div>

                {/* 4. 브라우저별 수동 가이드 */}
                {(showManualGuide || isFirefox) && !isIos && !isInAppBrowser && (
                    <div
                        className="p-2 border-round surface-200 text-xs text-800 mb-3 w-full text-center line-height-3"
                        style={{ maxWidth: '340px' }}
                    >
                        {isSamsung ? (
                            <>
                                💡 삼성인터넷 하단 메뉴(<b>≡</b>) &gt; <b>[현재 페이지 추가]</b> &gt; <b>[홈 화면]</b>을 눌러주세요.
                            </>
                        ) : isFirefox ? (
                            <>
                                💡 파이어폭스 우측 메뉴(<b>⋮</b>) &gt; <b>[설치]</b> 또는 <b>[홈 화면에 추가]</b>를 눌러주세요.
                            </>
                        ) : (
                            <>
                                💡 브라우저 우측 상단 메뉴(<b>⋮</b>)에서 <b>[앱 설치]</b> 또는 <b>[홈 화면에 추가]</b>를 눌러주세요.
                            </>
                        )}
                        <br />
                        <span className="text-orange-600 font-semibold" style={{ fontSize: '11px' }}>
                            (이미 설치된 경우 홈 화면의 <b>'{appName}'</b> 아이콘으로 열어주세요)
                        </span>
                    </div>
                )}

                {/* 5. 주요 액션 버튼 구성 */}
                <div className="flex flex-column gap-2 w-full" style={{ maxWidth: '340px' }}>
                    {isInAppBrowser ? (
                        <>
                            <Button
                                label="외부 브라우저로 열기 (크롬/기본)"
                                icon="pi pi-external-link"
                                severity="primary"
                                className="w-full font-bold py-3 border-round-xl shadow-2"
                                onClick={handleOpenExternalBrowser}
                            />
                            <Button
                                label="설치 링크 복사하기"
                                icon="pi pi-copy"
                                outlined
                                severity="secondary"
                                className="w-full font-medium py-2 border-round-xl text-xs"
                                onClick={handleCopyUrl}
                            />
                        </>
                    ) : isIos || isFirefox ? (
                        <Button
                            label="웹으로 바로 이동"
                            icon="pi pi-arrow-right"
                            iconPos="right"
                            outlined
                            className="w-full font-bold py-3 border-round-xl"
                            onClick={handleGoToWeb}
                        />
                    ) : (
                        <Button
                            label="앱 설치하기"
                            icon="pi pi-download"
                            className="w-full font-bold py-3 border-round-xl"
                            onClick={handleInstallClick}
                        />
                    )}
                </div>
            </div>
        </Sidebar>
    );
}
