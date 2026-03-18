// components/NotificationListener.tsx
'use client';

import { useEffect } from 'react';
import Pusher from 'pusher-js';
import { useToast } from '@/hooks/useToast';

export default function NotificationListener() {
    const { showToast } = useToast();
    useEffect(() => {
        // 1. Pusher 객체 생성
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
            cluster: 'ap3'
        });

        // 2. 채널 구독 (Express 서버에서 보낸 채널명과 일치해야 함)
        const channel = pusher.subscribe('my-channel');

        // 3. 이벤트 바인딩 (Express 서버에서 지정한 이벤트명)
        channel.bind('my-event', (data: { message: string; author: string }) => {
            // 서버에서 보낸 데이터를 토스트 알림으로 표시
            console.log('data', data);
            showToast({ severity: 'success', summary: '푸셔API동작확인', detail: data.message || 'hi' });
        });

        // 4. 컴포넌트 언마운트 시 구독 해제 (중요: 메모리 누수 방지)
        return () => {
            channel.unbind_all();
            channel.unsubscribe();
        };
    }, []);

    return null; // 토스트 메시지가 그려질 컨테이너
}
