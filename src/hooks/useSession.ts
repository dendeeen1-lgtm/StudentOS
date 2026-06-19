import { useState, useEffect } from 'react';
import { subscribeToActiveSession } from '../services/session.service';
import { subscribeToSessionRoster, getStudentHistory } from '../services/attendance.service';
import { subscribeToPendingRequests } from '../services/excused.service';
import { Session, AttendanceRecord, ExcusedRequest } from '../constants/types';

export const useSession = (sectionId: string | undefined) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sectionId) { setLoading(false); return; }
    const unsub = subscribeToActiveSession(sectionId, (s) => {
      setSession(s);
      setLoading(false);
    });
    return unsub;
  }, [sectionId]);

  return { session, loading };
};

export const useRoster = (sessionId: string | undefined) => {
  const [roster, setRoster] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }
    const unsub = subscribeToSessionRoster(sessionId, (records) => {
      setRoster(records);
      setLoading(false);
    });
    return unsub;
  }, [sessionId]);

  return { roster, loading };
};

export const useAttendanceHistory = (studentUid: string, sectionId: string) => {
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentUid || !sectionId) return;
    getStudentHistory(studentUid, sectionId).then((data) => {
      setHistory(data);
      setLoading(false);
    });
  }, [studentUid, sectionId]);

  return { history, loading };
};

export const usePendingExcused = (sectionId: string | undefined) => {
  const [requests, setRequests] = useState<ExcusedRequest[]>([]);

  useEffect(() => {
    if (!sectionId) return;
    const unsub = subscribeToPendingRequests(sectionId, setRequests);
    return unsub;
  }, [sectionId]);

  return { requests };
};
