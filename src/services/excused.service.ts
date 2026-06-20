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
import { AttendanceStatus } from '../constants';
import { ExcusedRequest } from '../constants/types';
import { updateAttendanceStatus } from './attendance.service';

export const submitExcusedRequest = async (
  data: Omit<ExcusedRequest, 'id' | 'submittedAt' | 'status'>
): Promise<string> => {
  const ref = await addDoc(collection(db, 'excusedRequests'), {
    ...data,
    status: 'pending',
    submittedAt: serverTimestamp(),
  });
  return ref.id;
};

export const approveExcusedRequest = async (
  requestId: string,
  attendanceRecordId: string,
  reviewedBy: string,
  note?: string
) => {
  await updateDoc(doc(db, 'excusedRequests', requestId), {
    status: 'approved',
    reviewedBy,
    reviewNote: note ?? '',
    reviewedAt: serverTimestamp(),
  });
  await updateAttendanceStatus(
    attendanceRecordId,
    AttendanceStatus.EXCUSED,
    reviewedBy,
    note
  );
};

export const denyExcusedRequest = async (
  requestId: string,
  attendanceRecordId: string,
  reviewedBy: string,
  note?: string
) => {
  await updateDoc(doc(db, 'excusedRequests', requestId), {
    status: 'denied',
    reviewedBy,
    reviewNote: note ?? '',
    reviewedAt: serverTimestamp(),
  });
  await updateAttendanceStatus(
    attendanceRecordId,
    AttendanceStatus.ABSENT,
    reviewedBy,
    note
  );
};

export const subscribeToPendingRequests = (
  sectionId: string,
  callback: (requests: ExcusedRequest[]) => void
) => {
  const q = query(
    collection(db, 'excusedRequests'),
    where('sectionId', '==', sectionId),
    where('status', '==', 'pending'),
    orderBy('submittedAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ExcusedRequest[]);
  });
};

export const getStudentExcusedRequests = async (
  studentUid: string
): Promise<ExcusedRequest[]> => {
  const snap = await getDocs(
    query(
      collection(db, 'excusedRequests'),
      where('studentUid', '==', studentUid),
      orderBy('submittedAt', 'desc')
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ExcusedRequest[];
};

export const approveExcusedRequestWithNotification = async (
  requestId: string,
  attendanceRecordId: string,
  studentUid: string,
  reviewedBy: string,
  note?: string
) => {
  await approveExcusedRequest(requestId, attendanceRecordId, reviewedBy, note);
  const { sendPushToStudent } = await import('./notification.service');
  await sendPushToStudent(
    studentUid,
    'Excuse request approved',
    'Your excuse request was approved. Please bring a printed copy of your excuse letter with your teacher signature to class.'
  );
};

export const denyExcusedRequestWithNotification = async (
  requestId: string,
  attendanceRecordId: string,
  studentUid: string,
  reviewedBy: string,
  note?: string
) => {
  await denyExcusedRequest(requestId, attendanceRecordId, reviewedBy, note);
  const { sendPushToStudent } = await import('./notification.service');
  await sendPushToStudent(
    studentUid,
    'Excuse request denied',
    'Your excuse request was denied. Your status has been marked Absent.'
  );
};
