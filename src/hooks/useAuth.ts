import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthChanged, getUserProfile } from '../services/auth.service';
import { StudentProfile, AdviserProfile, ParentProfile } from '../constants/types';

type AnyProfile = StudentProfile | AdviserProfile | ParentProfile | null;

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AnyProfile>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const p = await getUserProfile(firebaseUser.uid);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return { user, profile, loading };
};
