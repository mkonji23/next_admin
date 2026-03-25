// components/NotificationListener.tsx
'use client';

import { useEffect } from 'react';
import Pusher from 'pusher-js';
import { useToast } from '@/hooks/useToast';
import useAuthStore from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Notification, PusherMessage } from '@/types/notification';
import { useHttp } from '@/util/axiosInstance'; // Import useHttp

export default function NotificationListener() {
    const { showToast } = useToast();
    const { userInfo } = useAuthStore();
    const { addNotification, setNotifications } = useNotificationStore();
    const http = useHttp(); // Initialize useHttp

    useEffect(() => {
        if (!userInfo.auth || !userInfo.userId) return;

        // Fetch initial notifications
        const fetchNotifications = async () => {
            try {
                const response = await http.get(`/choiMath/notifications/${userInfo.userId}`); // Use http.get
                addNotification(response.data);
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            }
        };

        // 1. Pusher 객체 생성
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
            cluster: 'ap3'
        });

        // 2. 채널 구독 (Express 서버에서 보낸 채널명과 일치해야 함)
        const channel = pusher.subscribe(`user-${userInfo.userId}`);

        // 3. 이벤트 바인딩 (Express 서버에서 지정한 이벤트명)
        channel.bind('notification', (data: PusherMessage) => {
            // Add new notification to the store
            fetchNotifications();
            // Optionally, show a toast
            showToast({ severity: 'info', summary: '새 알림', detail: data.message });
        });

        // 4. 컴포넌트 언마운트 시 구독 해제 (중요: 메모리 누수 방지)
        return () => {
            channel.unbind_all();
            channel.unsubscribe();
        };
    }, [userInfo]);

    return null;
}
