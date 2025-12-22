
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { supabase } from "./supabaseClient";

// Your web app's Firebase configuration
// Replace these placeholders with your actual Firebase project settings
const firebaseConfig = {
    apiKey: "AIzaSyBJI7cIkOtN88cC36XPJperi6gX5ZvYZoE",
    authDomain: "gunderwear-4c470.firebaseapp.com",
    projectId: "gunderwear-4c470",
    storageBucket: "gunderwear-4c470.firebasestorage.app",
    messagingSenderId: "347473138246",
    appId: "1:347473138246:web:fb490f9e654ac91bd0b047",
    measurementId: "G-PJ4JXRCD98"
};

const app = initializeApp(firebaseConfig);
const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export const requestForToken = async (userId: string) => {
    if (!messaging) return;

    try {
        const currentToken = await getToken(messaging, {
            vapidKey: "BFOsxM8h_YBK9AAMirlTBT0gTm74lYrF7UxJlaudf5TTPEs0734j0UkkoltjEQNkQVPqE9vNV8bdiJUj6w4yJRs" // Get this from Firebase Console > Project Settings > Cloud Messaging > Web configuration
        });

        if (currentToken) {
            console.log('FCM Token:', currentToken);
            // Save token to Supabase profiles table
            const { error } = await supabase
                .from('profiles')
                .update({ fcm_token: currentToken })
                .eq('id', userId);

            if (error) console.error('Error saving FCM token:', error);
        } else {
            console.log('No registration token available. Request permission to generate one.');
        }
    } catch (err) {
        console.log('An error occurred while retrieving token. ', err);
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        if (!messaging) return;
        onMessage(messaging, (payload) => {
            console.log("Foreground message received:", payload);
            resolve(payload);
        });
    });
