// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
const firebaseConfig = {
    apiKey: 'AIzaSyBVnLDizyoMB8UxTvFo8wei57VJZ4ABcxI',
    authDomain: 'chochomath-2fc89.firebaseapp.com',
    projectId: 'chochomath-2fc89',
    storageBucket: 'chochomath-2fc89.firebasestorage.app',
    messagingSenderId: '647098852940',
    appId: '1:647098852940:web:ad6932ea0b661cf7cf36e9',
    measurementId: 'G-5DRVMEHZZZ'
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] 백그라운드 메시지 수신:', payload);

    const notificationTitle = payload.notification?.title || '알림';
    const notificationOptions = {
        body: payload.notification?.body || '',
        icon: payload.notification?.icon || '/icons/icon-192x192.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
