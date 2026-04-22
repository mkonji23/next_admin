import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, Messaging, getToken } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: 'AIzaSyBVnLDizyoMB8UxTvFo8wei57VJZ4ABcxI',
    authDomain: 'chochomath-2fc89.firebaseapp.com',
    projectId: 'chochomath-2fc89',
    storageBucket: 'chochomath-2fc89.firebasestorage.app',
    messagingSenderId: '647098852940',
    appId: '1:647098852940:web:ad6932ea0b661cf7cf36e9',
    measurementId: 'G-5DRVMEHZZZ'
};

// 앱이 이미 초기화되어 있으면 기존 앱을 사용하고, 아니면 새로 초기화합니다.
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let messaging: Messaging | undefined;

// 클라이언트 사이드에서만 messaging을 초기화합니다.
if (typeof window !== 'undefined') {
    messaging = getMessaging(app);
}

export const requestFcmToken = async () => {
    if (typeof window === 'undefined') return null;

    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted' && messaging) {
            const token = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            });
            if (token) {
                console.log('FCM Token:', token);
                return token;
            }
        }
    } catch (error) {
        console.error('FCM Token Error:', error);
    }
    return null;
};

export { app, messaging };
