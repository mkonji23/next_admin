import { create } from 'zustand';
import { Notification } from '@/types/notification';

interface NotificationStore {
    notifications: Notification[];
    setNotifications: (notifications: Notification[]) => void;
    addNotification: (notification: Notification) => void;
    markAsRead: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
    notifications: [],
    setNotifications: (notifications) => set({ notifications }),
    addNotification: (notification) =>
        set((state) => {
            const incoming = Array.isArray(notification) ? notification : [notification];
            const combined = [...incoming, ...state.notifications];

            // Map에 [Key타입, Value타입]을 명시해줍니다.
            // 예: Key는 string(_id), Value는 Notification 객체
            const uniqueNotifications = Array.from(
                combined
                    .reduce((map, item) => {
                        const id = item._id; // 고유 ID 필드
                        if (id && !map.has(id)) {
                            map.set(id, item);
                        }
                        return map;
                    }, new Map<string, any>())
                    .values() // <string, any> 또는 <string, Notification>
            );

            return {
                notifications: uniqueNotifications as Notification[] // 최종 타입을 확정해줍니다.
            };
        }),
    markAsRead: (id) =>
        set((state) => ({
            notifications: state.notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        }))
}));
