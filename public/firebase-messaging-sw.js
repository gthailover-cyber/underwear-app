
// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
    apiKey: "AIzaSyBJI7cIkOtN88cC36XPJperi6gX5ZvYZoE",
    authDomain: "gunderwear-4c470.firebaseapp.com",
    projectId: "gunderwear-4c470",
    storageBucket: "gunderwear-4c470.firebasestorage.app",
    messagingSenderId: "347473138246",
    appId: "1:347473138246:web:fb490f9e654ac91bd0b047",
    measurementId: "G-PJ4JXRCD98"
});

const messaging = firebase.messaging();

// Background message handler
// หมายเหตุ: เมื่อ FCM ได้รับ payload ที่มี "notification" field 
// มันจะแสดง notification อัตโนมัติ ไม่ต้องเรียก showNotification ซ้ำ
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background message received:', payload);
    // ไม่ต้อง showNotification เพราะ FCM จัดการให้แล้ว
});
