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
    const { title, body, icon, url } = payload.data;
    self.registration.showNotification(title, {
        body,
        icon, // 여기서 내가 원하는 앱 아이콘으로 고정!
        data: { url }
    });
});

// 알림 클릭 이벤트 리스너
self.addEventListener('notificationclick', function (event) {
    event.notification.close(); // 일단 알림창을 닫습니다.

    // 알림 페이로드에 포함된 이동할 URL (없으면 기본값 '/')
    const urlToOpen = event.notification.data?.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
            // 1. 이미 앱이 열려 있는 탭이 있는지 확인
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // 2. 같은 URL의 탭이 없다면 새 창으로 열기
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

