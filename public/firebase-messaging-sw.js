importScripts('https://www.gstatic.com/firebasejs/12.12.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.12.1/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: 'AIzaSyBVnLDizyoMB8UxTvFo8wei57VJZ4ABcxI',
    authDomain: 'chochomath-2fc89.firebaseapp.com',
    projectId: 'chochomath-2fc89',
    storageBucket: 'chochomath-2fc89.firebasestorage.app',
    messagingSenderId: '647098852940',
    appId: '1:647098852940:web:ad6932ea0b661cf7cf36e9',
    measurementId: 'G-5DRVMEHZZZ',
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/favicon.ico', // 기본 아이콘 경로
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
