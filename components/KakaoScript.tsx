'use client';

import Script from 'next/script';

export default function KakaoScript() {
    // 환경 변수에서 키를 가져오고 없으면 기본값(예비용) 사용
    const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY || '82c0e86b245749f7ba36a73a6a908a73';

    return (
        <Script
            src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.0/kakao.min.js"
            strategy="afterInteractive"
            onReady={() => {
                // window.Kakao가 존재하는지 확인 후 초기화
                if (typeof window !== 'undefined' && window.Kakao) {
                    if (!window.Kakao.isInitialized()) {
                        window.Kakao.init(KAKAO_KEY);
                        console.log('Kakao SDK initialized:', window.Kakao.isInitialized());
                    }
                } else {
                    console.error('Kakao SDK window object not found');
                }
            }}
        />
    );
}
