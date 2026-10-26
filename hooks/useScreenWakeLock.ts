'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseScreenWakeLockReturn {
    isSupported: boolean;
    isActive: boolean;
    requestWakeLock: () => Promise<boolean>;
    releaseWakeLock: () => Promise<void>;
}

/**
 * 모바일 및 데스크톱 브라우저에서 화면 꺼짐/잠금(Display Sleep/Lock)을 방지하는 커스텀 훅
 *
 * 1. 표준 Screen Wake Lock API (Chrome 84+, Safari iOS 16.4+, Edge, Samsung Internet)
 * 2. 탭 복귀(visibilitychange -> visible) 시 W3C 사양에 맞춘 자동 재활성화
 * 3. Wake Lock 미지원 구형 환경을 위한 무음 인라인 비디오 Fallback
 */
export const useScreenWakeLock = (enabled: boolean = false): UseScreenWakeLockReturn => {
    const [isSupported, setIsSupported] = useState<boolean>(false);
    const [isActive, setIsActive] = useState<boolean>(false);
    const wakeLockRef = useRef<any>(null);
    const enabledRef = useRef<boolean>(enabled);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        enabledRef.current = enabled;
    }, [enabled]);

    // 브라우저의 Screen Wake Lock API 지원 여부 확인
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const supported = 'wakeLock' in navigator;
            setIsSupported(supported);
        }
    }, []);

    // 1. 화면 잠금 방지 요청
    const requestWakeLock = useCallback(async (): Promise<boolean> => {
        if (typeof window === 'undefined') return false;

        // 이미 Sentinel이 유효하게 유지되고 있다면 중복 요청 생략
        if (wakeLockRef.current && !wakeLockRef.current.released) {
            setIsActive(true);
            return true;
        }

        // 1) 표준 Screen Wake Lock API 시도
        if ('wakeLock' in navigator) {
            try {
                const sentinel = await (navigator as any).wakeLock.request('screen');
                wakeLockRef.current = sentinel;
                setIsActive(true);

                sentinel.addEventListener('release', () => {
                    wakeLockRef.current = null;
                    setIsActive(false);
                });

                return true;
            } catch (err: any) {
                // 저전력 모드(Low Power Mode) 또는 시스템 정책으로 거부될 경우 경고 후 fallback 시도
                console.warn('[useScreenWakeLock] Native wakeLock request failed:', err?.message || err);
            }
        }

        // 2) Fallback: 무음 비디오 루프 (구형 브라우저 및 인앱 브라우저 호환)
        try {
            if (!videoRef.current) {
                const video = document.createElement('video');
                video.setAttribute('playsinline', '');
                video.setAttribute('webkit-playsinline', '');
                video.setAttribute('loop', '');
                video.muted = true;
                video.style.position = 'fixed';
                video.style.left = '-9999px';
                video.style.top = '-9999px';
                video.style.width = '1px';
                video.style.height = '1px';
                video.style.opacity = '0';
                video.style.pointerEvents = 'none';

                // 초소형 0.1초 빈 mp4 data URI
                video.src = 'data:video/mp4;base64,AAAAHGZ0eXBpc29tAAAAAGlzb21tcDQxAAAACHZpZGVvAAAA';
                document.body.appendChild(video);
                videoRef.current = video;
            }

            if (videoRef.current && videoRef.current.paused) {
                await videoRef.current.play().catch(() => {});
                setIsActive(true);
                return true;
            }
        } catch (_) {}

        return false;
    }, []);

    // 2. 화면 잠금 방지 해제
    const releaseWakeLock = useCallback(async () => {
        if (wakeLockRef.current) {
            try {
                await wakeLockRef.current.release();
            } catch (_) {}
            wakeLockRef.current = null;
        }

        if (videoRef.current) {
            try {
                videoRef.current.pause();
            } catch (_) {}
        }

        setIsActive(false);
    }, []);

    // enabled 상태 변경 시 락 획득/반환
    useEffect(() => {
        if (enabled) {
            requestWakeLock();
        } else {
            releaseWakeLock();
        }

        return () => {
            releaseWakeLock();
        };
    }, [enabled, requestWakeLock, releaseWakeLock]);

    // 탭 복귀 시 (visibilitychange) enabled가 true라면 락 재획득
    // W3C 명세: 브라우저 탭이 백그라운드로 전환되면 wakeLock은 브라우저에 의해 자동 해제(release)됨.
    // 다시 visible 상태로 돌아왔을 때 세션이 유지 중이면 재요청 필수.
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible' && enabledRef.current) {
                await requestWakeLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [requestWakeLock]);

    // 언마운트 시 DOM 비디오 정리
    useEffect(() => {
        return () => {
            if (videoRef.current && videoRef.current.parentNode) {
                videoRef.current.parentNode.removeChild(videoRef.current);
                videoRef.current = null;
            }
        };
    }, []);

    return {
        isSupported,
        isActive,
        requestWakeLock,
        releaseWakeLock,
    };
};
