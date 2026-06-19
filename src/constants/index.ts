export * from './colors';
export * from './typography';

export enum UserRole {
  ADVISER = 'adviser',
  MONITOR = 'monitor',
  STUDENT = 'student',
  PARENT = 'parent',
}

export enum AttendanceStatus {
  PRESENT = 'present',
  LATE = 'late',
  ABSENT = 'absent',
  EXCUSED = 'excused',
  OUTSIDE = 'outside',
  PENDING = 'pending',
}

export enum QRType {
  PRESENT = 'PRESENT',
  EXCUSED = 'EXCUSED',
  OUTSIDE = 'OUTSIDE',
}

export enum SessionState {
  IDLE = 'idle',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ENDED = 'ended',
}

export const StatusLabel: Record<string, string> = {
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
  excused: 'Excused',
  outside: 'Outside',
  pending: 'Pending',
};

export const PRESENT_WINDOW_DEFAULT = 10; // minutes
export const SESSION_DURATION_DEFAULT = 60; // minutes
export const PARENT_LINK_EXPIRY_HOURS = 48;
