import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
    browserLocalPersistence,
    getReactNativePersistence,
    initializeAuth
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyC_GepIJHlVuPM_S90ye9lkHop-50Jgv8A",
  authDomain: "rpgym-436e1.firebaseapp.com",
  projectId: "rpgym-436e1",
  storageBucket: "rpgym-436e1.appspot.com",
  messagingSenderId: "142629336797",
  appId: "1:142629336797:web:852051fe0cc4ab111d8d34",
  measurementId: "G-8Y2941KZGW",
};

// Initialize Firebase App
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Conditionally initialize Auth based on the platform
export const auth = initializeAuth(app, {
  persistence: Platform.OS === 'web' 
    ? browserLocalPersistence // Use browser persistence on web
    : getReactNativePersistence(AsyncStorage) // Use React Native persistence on mobile
});

export const db = getFirestore(app);
