'use client';

import React, { useState, useRef, useEffect } from 'react';
import { OverlayPanel } from 'primereact/overlaypanel';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { ScrollPanel } from 'primereact/scrollpanel';
import useAuthStore from '@/store/useAuthStore';

interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    message: string;
    timestamp: Date;
    isOwn: boolean;
}

interface ChatPanelProps {
    visible: boolean;
    onHide: () => void;
    target: any;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ visible, onHide, target }) => {
    const { userInfo } = useAuthStore();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const op = useRef<OverlayPanel>(null);
    const scrollPanelRef = useRef<any>(null);

    useEffect(() => {
        if (visible && target) {
            op.current?.show(null, target);
        } else {
            op.current?.hide();
        }
    }, [visible, target]);

    useEffect(() => {
        // 스크롤을 맨 아래로 이동
        if (scrollPanelRef.current) {
            const scrollElement = scrollPanelRef.current.contentElement;
            if (scrollElement) {
                scrollElement.scrollTop = scrollElement.scrollHeight;
            }
        }
    }, [messages]);

    const handleSendMessage = () => {
        if (!newMessage.trim() || !userInfo?.userId) return;

        const message: ChatMessage = {
            id: Date.now().toString(),
            senderId: userInfo.userId,
            senderName: userInfo.userName || '익명',
            message: newMessage.trim(),
            timestamp: new Date(),
            isOwn: true
        };

        setMessages([...messages, message]);
        setNewMessage('');

        // TODO: 실제 API 호출로 서버에 메시지 전송
        // await http.post('/choiMath/chat/sendMessage', message);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (date: Date) => {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    return (
        <OverlayPanel ref={op} style={{ width: '400px' }} className="chat-overlay-panel">
            <div className="chat-panel">
                <div className="chat-header">
                    <h5 className="m-0">채팅</h5>
                    <Button
                        icon="pi pi-times"
                        className="p-button-text p-button-rounded p-button-plain"
                        onClick={onHide}
                    />
                </div>
                <ScrollPanel ref={scrollPanelRef} style={{ height: '400px' }} className="chat-messages">
                    {messages.length === 0 ? (
                        <div className="chat-empty">
                            <i className="pi pi-comments" style={{ fontSize: '3rem', color: 'var(--text-color-secondary)' }} />
                            <p className="text-500 mt-3">메시지가 없습니다.</p>
                            <p className="text-500 text-sm">메시지를 입력하여 대화를 시작하세요.</p>
                        </div>
                    ) : (
                        <div className="chat-message-list">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`chat-message ${msg.isOwn ? 'own-message' : 'other-message'}`}
                                >
                                    {!msg.isOwn && (
                                        <Avatar
                                            label={msg.senderName.charAt(0)}
                                            className="mr-2"
                                            style={{ backgroundColor: 'var(--surface-300)', color: 'var(--text-color)' }}
                                        />
                                    )}
                                    <div className="message-content">
                                        {!msg.isOwn && (
                                            <div className="message-sender">{msg.senderName}</div>
                                        )}
                                        <div className="message-bubble">
                                            {msg.message}
                                        </div>
                                        <div className="message-time">{formatTime(msg.timestamp)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollPanel>
                <div className="chat-input">
                    <InputText
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="메시지를 입력하세요..."
                        className="flex-1"
                    />
                    <Button
                        icon="pi pi-send"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="ml-2"
                    />
                </div>
            </div>
        </OverlayPanel>
    );
};

export default ChatPanel;
