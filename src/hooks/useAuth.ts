import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthChanged, getUserProfile } from '../services/auth.service';
import { StudentProfile, AdviserProfile, ParentProfile } from '../constants/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AnyProfile = StudentProfile | AdviserProfile | ParentProfile | null;

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AnyProfile>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChanged(async (firebaseUser) => {
      try {
        setUser(firebaseUser);
        if (firebaseUser) {
          // Try cache first for faster load
          const cached = await AsyncStorage.getItem(`profile_${firebaseUser.uid}`);
          if (cached) setProfile(JSON.parse(cached));
          // Then fetch fresh
          const p = await getUserProfile(firebaseUser.uid);
          if (p) {
            setProfile(p);
            await AsyncStorage.setItem(`profile_${firebaseUser.uid}`, JSON.stringify(p));
          }
        } else {
          setProfile(null);
        }
      } catch (e) {
        console.log('Auth error:', e);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  return { user, profile, loading };
};
