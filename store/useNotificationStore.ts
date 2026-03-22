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
        set((state) => ({ notifications: [notification, ...state.notifications] })),
    markAsRead: (id) =>
        set((state) => ({
            notifications: state.notifications.map((n) =>
                n._id === id ? { ...n, isRead: true } : n
            ),
        })),
}));
