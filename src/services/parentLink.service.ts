import {
  doc,
  updateDoc,
  getDocs,
  collection,
  query,
  where,
  arrayUnion,
} from 'firebase/firestore';
import { db } from './firebase';
import { PARENT_LINK_EXPIRY_HOURS } from '../constants';

const generateCode = (name: string): string => {
  const prefix = name.replace(/\s+/g, '').substring(0, 4).toUpperCase();
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${suffix}`;
};

export const generateParentLinkCode = async (
  studentUid: string,
  studentName: string
): Promise<string> => {
  const code = generateCode(studentName);
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + PARENT_LINK_EXPIRY_HOURS);

  await updateDoc(doc(db, 'users', studentUid), {
    parentLinkCode: code,
    parentLinkExpiry: expiry,
  });

  return code;
};

export const consumeParentLinkCode = async (
  code: string,
  parentUid: string
): Promise<{ success: boolean; studentName?: string; error?: string }> => {
  const snap = await getDocs(
    query(collection(db, 'users'), where('parentLinkCode', '==', code))
  );

  if (snap.empty) return { success: false, error: 'Invalid link code.' };

  const studentDoc = snap.docs[0];
  const studentData = studentDoc.data();

  const expiry = studentData.parentLinkExpiry?.toDate?.() ?? new Date(0);
  if (new Date() > expiry) {
    return { success: false, error: 'This link code has expired. Ask the student to generate a new one.' };
  }

  const studentUid = studentDoc.id;

  // Link parent to student and student to parent
  await updateDoc(doc(db, 'users', studentUid), {
    linkedParentUids: arrayUnion(parentUid),
    parentLinkCode: null,
    parentLinkExpiry: null,
  });

  await updateDoc(doc(db, 'users', parentUid), {
    linkedStudentUids: arrayUnion(studentUid),
  });

  return { success: true, studentName: studentData.fullName };
};
