import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDsPtV0N-Xy2wy3HWlFXsXUWDUwYfvPAQ4",
  authDomain: "studentos-cb295.firebaseapp.com",
  projectId: "studentos-cb295",
  storageBucket: "studentos-cb295.firebasestorage.app",
  messagingSenderId: "241866357875",
  appId: "1:241866357875:android:de18a90c37bf5e27933e06",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getApps().length === 1
  ? initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    })
  : require('firebase/auth').getAuth(app);

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
