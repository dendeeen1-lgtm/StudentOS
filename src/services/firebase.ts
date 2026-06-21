import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
const firebaseConfig = {
  apiKey: "AIzaSyDsPtV0N-Xy2wy3HWlFXsXUWDUwYfvPAQ4",
  authDomain: "studentos-cb295.firebaseapp.com",
  projectId: "studentos-cb295",
  storageBucket: "studentos-cb295.firebasestorage.app",
  messagingSenderId: "241866357875",
  appId: "1:241866357875:android:de18a90c37bf5e27933e06",
};
let app; let auth;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} else {
  app = getApp();
  auth = getAuth(app);
}
export { auth };
export const db = getFirestore(app);
export default app;
