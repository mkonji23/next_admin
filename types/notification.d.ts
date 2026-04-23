export interface Notification {
    _id: string;
    recipientId: string;
    createdAt: string;
    content: string;
    isRead: boolean;
    createdAt: Date;
    detail: NotificationDetail;
}

export interface PusherMessage {
    [key: string]: any;
    content?: string;
}

interface NotificationDetail {
    _id: string;
    senderId: string;
    targetAuth: string;
    type: string;
    content: string;
    link: string;
    createdAt: string;
}
