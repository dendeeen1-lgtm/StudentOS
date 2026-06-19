import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserRole } from '../constants';
import { StudentProfile, AdviserProfile, ParentProfile } from '../constants/types';

export const signIn = async (email: string, password: string) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

export const signOut = async () => {
  await firebaseSignOut(auth);
};

export const registerStudent = async (
  email: string,
  password: string,
  data: Omit<StudentProfile, 'uid' | 'email' | 'role' | 'createdAt' | 'linkedParentUids'>
) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const uid = result.user.uid;
  const profile: StudentProfile = {
    uid,
    email,
    role: UserRole.STUDENT,
    fullName: data.fullName,
    age: data.age,
    birthday: data.birthday,
    section: data.section,
    lrn: data.lrn,
    school: data.school,
    address: data.address,
    sectionId: data.sectionId,
    isApproved: false,
    linkedParentUids: [],
    createdAt: new Date(),
  };
  await setDoc(doc(db, 'users', uid), {
    ...profile,
    createdAt: serverTimestamp(),
  });
  return profile;
};

export const registerParent = async (
  email: string,
  password: string,
  data: { fullName: string; mobileNumber: string; relationship: string }
) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const uid = result.user.uid;
  const profile: ParentProfile = {
    uid,
    email,
    role: UserRole.PARENT,
    fullName: data.fullName,
    mobileNumber: data.mobileNumber,
    relationship: data.relationship,
    linkedStudentUids: [],
    createdAt: new Date(),
  };
  await setDoc(doc(db, 'users', uid), {
    ...profile,
    createdAt: serverTimestamp(),
  });
  return profile;
};

export const getUserProfile = async (uid: string) => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as StudentProfile | AdviserProfile | ParentProfile;
};

export const onAuthChanged = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const updateFCMToken = async (uid: string, token: string) => {
  await updateDoc(doc(db, 'users', uid), { fcmToken: token });
};
