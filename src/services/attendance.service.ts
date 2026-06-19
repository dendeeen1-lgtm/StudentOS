import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { AttendanceStatus, SessionState } from '../constants';
import { AttendanceRecord, Session, QRPayload } from '../constants/types';
import { parseQRPayload } from './qr.service';

export const recordScan = async (
  payload: QRPayload,
  studentUid: string,
  studentName: string,
  session: Session
): Promise<AttendanceRecord> => {
  // Check for duplicate scan
  const existing = await getDocs(
    query(
      collection(db, 'attendance'),
      where('sessionId', '==', session.id),
      where('studentUid', '==', studentUid)
    )
  );

  if (!existing.empty) {
    throw new Error('Already scanned for this session.');
  }

  // Determine if Present or Late based on timestamp
  const now = Date.now();
  const startedAt = session.startedAt
    ? (session.startedAt as any).toMillis?.() ?? Date.now()
    : Date.now();
  const presentWindowMs = session.presentWindowMinutes * 60 * 1000;
  const isLate = now - startedAt > presentWindowMs;

  let status: AttendanceStatus;
  if (payload.type === 'PRESENT') {
    status = isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;
  } else if (payload.type === 'EXCUSED') {
    status = AttendanceStatus.PENDING;
  } else {
    status = AttendanceStatus.OUTSIDE;
  }

  const ref = await addDoc(collection(db, 'attendance'), {
    sessionId: session.id,
    sectionId: session.sectionId,
    studentUid,
    studentName,
    status,
    scannedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    id: ref.id,
    sessionId: session.id,
    sectionId: session.sectionId,
    studentUid,
    studentName,
    status,
    updatedAt: new Date(),
  };
};

export const autoMarkAbsent = async (sessionId: string, sectionId: string) => {
  // Get all students in section
  const studentsSnap = await getDocs(
    query(
      collection(db, 'users'),
      where('sectionId', '==', sectionId),
      where('isApproved', '==', true)
    )
  );

  // Get all attendance records for this session
  const attendanceSnap = await getDocs(
    query(collection(db, 'attendance'), where('sessionId', '==', sessionId))
  );

  const scannedUids = new Set(attendanceSnap.docs.map((d) => d.data().studentUid));

  const batch: Promise<void>[] = [];
  studentsSnap.docs.forEach((studentDoc) => {
    const uid = studentDoc.id;
    if (!scannedUids.has(uid)) {
      batch.push(
        addDoc(collection(db, 'attendance'), {
          sessionId,
          sectionId,
          studentUid: uid,
          studentName: studentDoc.data().fullName,
          status: AttendanceStatus.ABSENT,
          updatedAt: serverTimestamp(),
        }).then(() => {})
      );
    }
  });

  await Promise.all(batch);
};

export const updateAttendanceStatus = async (
  recordId: string,
  status: AttendanceStatus,
  updatedBy: string,
  note?: string
) => {
  await updateDoc(doc(db, 'attendance', recordId), {
    status,
    updatedBy,
    note: note ?? '',
    updatedAt: serverTimestamp(),
  });
};

export const subscribeToSessionRoster = (
  sessionId: string,
  callback: (records: AttendanceRecord[]) => void
) => {
  const q = query(
    collection(db, 'attendance'),
    where('sessionId', '==', sessionId),
    orderBy('scannedAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const records = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as AttendanceRecord[];
    callback(records);
  });
};

export const getStudentHistory = async (
  studentUid: string,
  sectionId: string
): Promise<AttendanceRecord[]> => {
  const snap = await getDocs(
    query(
      collection(db, 'attendance'),
      where('studentUid', '==', studentUid),
      where('sectionId', '==', sectionId),
      orderBy('updatedAt', 'desc')
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as AttendanceRecord[];
};
