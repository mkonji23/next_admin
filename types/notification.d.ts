export interface Notification {
    _id: string;
    recipientIds: string[];
    senderId: string;
    type: string;
    content: string;
    link: string;
    isRead: boolean;
    createdAt: string;
}
