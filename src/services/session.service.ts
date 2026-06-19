import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { SessionState, QRType, PRESENT_WINDOW_DEFAULT, SESSION_DURATION_DEFAULT } from '../constants';
import { Session } from '../constants/types';
import { generateQRPayloads } from './qr.service';

export const createSession = async (
  sectionId: string,
  createdBy: string,
  options: {
    name?: string;
    presentWindowMinutes?: number;
    durationMinutes?: number;
    autoEnd?: boolean;
  } = {}
): Promise<string> => {
  const durationMinutes = options.durationMinutes ?? SESSION_DURATION_DEFAULT;
  const sessionRef = await addDoc(collection(db, 'sessions'), {
    sectionId,
    name: options.name ?? 'Attendance session',
    state: SessionState.IDLE,
    presentWindowMinutes: options.presentWindowMinutes ?? PRESENT_WINDOW_DEFAULT,
    durationMinutes,
    autoEnd: options.autoEnd ?? true,
    createdBy,
    createdAt: serverTimestamp(),
    qrPayloadPresent: '',
    qrPayloadExcused: '',
    qrPayloadOutside: '',
  });
  return sessionRef.id;
};

export const startSession = async (sessionId: string, sectionId: string, durationMinutes: number) => {
  const payloads = generateQRPayloads(sessionId, sectionId, durationMinutes);
  await updateDoc(doc(db, 'sessions', sessionId), {
    state: SessionState.ACTIVE,
    startedAt: serverTimestamp(),
    pausedAt: null,
    qrPayloadPresent: payloads[QRType.PRESENT],
    qrPayloadExcused: payloads[QRType.EXCUSED],
    qrPayloadOutside: payloads[QRType.OUTSIDE],
  });
};

export const pauseSession = async (sessionId: string) => {
  await updateDoc(doc(db, 'sessions', sessionId), {
    state: SessionState.PAUSED,
    pausedAt: serverTimestamp(),
  });
};

export const resumeSession = async (sessionId: string) => {
  await updateDoc(doc(db, 'sessions', sessionId), {
    state: SessionState.ACTIVE,
    pausedAt: null,
  });
};

export const endSession = async (sessionId: string) => {
  await updateDoc(doc(db, 'sessions', sessionId), {
    state: SessionState.ENDED,
    endedAt: serverTimestamp(),
    qrPayloadPresent: '',
    qrPayloadExcused: '',
    qrPayloadOutside: '',
  });
};

export const getSession = async (sessionId: string): Promise<Session | null> => {
  const snap = await getDoc(doc(db, 'sessions', sessionId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Session;
};

export const subscribeToActiveSession = (
  sectionId: string,
  callback: (session: Session | null) => void
) => {
  const q = query(
    collection(db, 'sessions'),
    where('sectionId', '==', sectionId),
    where('state', 'in', [SessionState.ACTIVE, SessionState.PAUSED])
  );
  return onSnapshot(q, (snap) => {
    if (snap.empty) {
      callback(null);
    } else {
      const docSnap = snap.docs[0];
      callback({ id: docSnap.id, ...docSnap.data() } as Session);
    }
  });
};
