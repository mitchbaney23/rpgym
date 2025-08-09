import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);

export const auth = Platform.OS !== 'web'
  ? initializeAuth(app, {
      // Use dynamic access to support SDK versions where the symbol location differs
      persistence: (require('firebase/auth') as any).getReactNativePersistence(AsyncStorage),
    })
  : getAuth(app);

export const firestore = getFirestore(app);

if (__DEV__ && Platform.OS === 'web') {
  try {
    connectFirestoreEmulator(firestore, 'localhost', 8080);
  } catch (error) {
    console.log('Firestore emulator already connected');
  }
}