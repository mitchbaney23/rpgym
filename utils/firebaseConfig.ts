// 📄 utils/firebaseConfig.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC_GepIJHlVuPM_S90ye9lkHop-50Jgv8A",
  authDomain: "rpgym-436e1.firebaseapp.com",
  projectId: "rpgym-436e1",
  storageBucket: "rpgym-436e1.appspot.com",
  messagingSenderId: "142629336797",
  appId: "1:142629336797:web:852051fe0cc4ab111d8d34",
  measurementId: "G-8Y2941KZGW",
};

// ✅ Only initialize Firebase once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
