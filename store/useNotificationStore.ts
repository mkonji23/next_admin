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
            // 들어온 값이 배열이면 펼쳐서 넣고, 객체면 그냥 넣음
            const newItems = Array.isArray(notification) ? notification : [notification];
            return {
                notifications: [...newItems, ...state.notifications]
            };
        }),
    markAsRead: (id) =>
        set((state) => ({
            notifications: state.notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        }))
}));
