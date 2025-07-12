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

let app;

// Check if any apps are already initialized
if (getApps().length === 0) {
  // If no apps are initialized, create a new one
  app = initializeApp(firebaseConfig);
} else {
  // If an app is already initialized, use the existing one
  app = getApp();
}

// Initialize Auth and Firestore with the correct app instance
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
