'use client';

import { useEffect } from 'react';
import Pusher from 'pusher-js';
import { useToast } from '@/hooks/useToast';
import useStudentAuthStore from '@/store/useStudentAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useRefreshStore } from '@/store/useRefreshStore';
import { PusherMessage } from '@/types/notification';
import { useHttp } from '@/util/axiosInstance';

export default function NotificationStudentListener() {
    const { showToast } = useToast();
    const { studentAuthData } = useStudentAuthStore();
    const { addNotification } = useNotificationStore();
    const { triggerNoticeRefresh } = useRefreshStore();
    const http = useHttp();

    useEffect(() => {
        const studentId = studentAuthData?.studentId;
        if (!studentId) return;

        // Fetch initial notifications
        const fetchNotifications = async () => {
            try {
                const response = await http.get(`/choiMath/notifications/${studentId}`, {
                    disableLoading: true
                });
                addNotification(response.data);
            } catch (error) {
                console.error('Failed to fetch student notifications:', error);
            }
        };

        // 1. Pusher 초기화
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
            cluster: 'ap3'
        });

        // 2. 채널 구독 (Express 서버에서 지정한 채널명: user-{userId})
        const channel = pusher.subscribe(`user-${studentId}`);

        // 3. 이벤트 바인딩 (알림용)
        // channel.bind('notification', (data: PusherMessage) => {
        //     fetchNotifications();
        //     showToast({ severity: 'info', summary: '새 알림', detail: data.content });
        // });

        channel.bind('refresh', (data: PusherMessage) => {
            console.log('data', data);
            if (data.type === 'NOTICE') {
                // 본인 채널로 수신했으므로 기본적으로 리프레시를 수행하되,
                // 데이터에 targetIds가 포함된 경우 한 번 더 확인합니다.
                if (!data.targetIds || (Array.isArray(data.targetIds) && data.targetIds.includes(studentId))) {
                    triggerNoticeRefresh();
                }
            }
        });

        // 4. 컴포넌트 언마운트 시 구독 해제
        return () => {
            channel.unbind_all();
            channel.unsubscribe();
        };
    }, [studentAuthData]);

    return null;
}
